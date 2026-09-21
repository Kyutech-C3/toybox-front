import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import FavoriteButton from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

describe("お気に入り", () => {
  it("一覧の初期値を使い、個別status/countを取得せず切り替える", async () => {
    useAuthStore.getState().startSession("token");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <FavoriteButton workID="work" isInitiallyLiked={false} />
      </TestProviders>,
    );
    const button = page.getByRole("button", { name: /いいね/ });
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(fetchMock).not.toHaveBeenCalled();
    await button.click();
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
    await expect.element(button).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    await button.click();
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE");
  });
  it("送信中は操作を止め、失敗すると楽観的更新を戻す", async () => {
    useAuthStore.getState().startSession("token");
    const pending = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <FavoriteButton workID="work" isInitiallyLiked={false} />
      </TestProviders>,
    );
    const button = page.getByRole("button", { name: /いいね/ });
    await button.click();
    await expect.element(button).toBeDisabled();
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
    pending.resolve(Response.json({}, { status: 500 }));
    await expect.element(button).toBeEnabled();
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect.element(page.getByRole("alert")).toBeVisible();
  });
  it("未ログインでは送信できない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <FavoriteButton workID="work" isInitiallyLiked={false} />
      </TestProviders>,
    );
    await expect.element(page.getByRole("button")).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("詳細では件数とstatusを取得する", async () => {
    useAuthStore.getState().startSession("token");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url) =>
        Response.json(
          String(url).endsWith("is-favorite")
            ? { is_favorite: true }
            : { total: 7 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <FavoriteButton workID="work" isCountVisible />
      </TestProviders>,
    );
    await expect
      .element(page.getByRole("button"))
      .toHaveAttribute("aria-pressed", "true");
    await expect.element(page.getByRole("button")).toHaveTextContent("7");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
