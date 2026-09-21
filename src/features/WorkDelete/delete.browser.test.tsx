import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import DeleteWorkButton from "./DeleteWorkButton";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

const setup = async (userID = "owner") => {
  useAuthStore.getState().startSession("token");
  useUserStore
    .getState()
    .setUser({ id: userID, display_name: "名前", icon_url: "" });
  const onDeleted = vi.fn();
  await render(
    <TestProviders>
      <DeleteWorkButton workID="work" ownerID="owner" onDeleted={onDeleted} />
    </TestProviders>,
  );
  return onDeleted;
};

describe("作品削除", () => {
  it("他人の作品には削除操作を表示しない", async () => {
    await setup("other");
    await expect
      .element(page.getByRole("button", { name: "削除", exact: true }))
      .not.toBeInTheDocument();
  });
  it("確認をキャンセルするとAPIを呼ばない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await setup();
    await page.getByRole("button", { name: /削除/ }).click();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("削除中は操作を止め204後に完了を通知", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleted = await setup();
    await page.getByRole("button", { name: /削除/ }).click();
    await expect
      .element(page.getByRole("button", { name: /削除/ }))
      .toBeDisabled();
    pending.resolve(new Response(null, { status: 204 }));
    await expect.poll(() => onDeleted.mock.calls.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("作品を削除しました");
  });
  it.each([
    [403, "この作品を削除する権限がありません"],
    [404, "作品が見つかりません"],
    [500, "サーバーで問題が発生しました"],
  ])("失敗 %i は完了扱いにしない", async (status, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status })),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleted = await setup();
    await page.getByRole("button", { name: /削除/ }).click();
    await expect.element(page.getByRole("alert")).toHaveTextContent(message);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
