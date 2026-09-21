import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import Header from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

describe("アカウントメニュー", () => {
  it.each([204, 500])(
    "ログアウト %i は多重送信を止めローカル認証を解除",
    async (status) => {
      useAuthStore.getState().startSession("token");
      const pending = deferred<Response>();
      const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) =>
        String(url).endsWith("/auth/logout")
          ? pending.promise
          : Response.json({
              id: "owner",
              display_name: "作者",
              icon_url: "",
            }),
      );
      vi.stubGlobal("fetch", fetchMock);
      await render(
        <TestProviders>
          <Header />
        </TestProviders>,
      );
      const trigger = page.getByRole("button", {
        name: "アカウントメニューを開く",
      });
      await trigger.click();
      await expect
        .element(page.getByRole("menuitem", { name: "マイページ" }))
        .toHaveFocus();
      await userEvent.keyboard("{End}");
      await expect
        .element(
          page.getByRole("menuitem", { name: "ログアウト", exact: true }),
        )
        .toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("menuitem", { name: "ログアウト中..." }))
        .toBeDisabled();
      pending.resolve(new Response(null, { status }));
      await expect
        .element(page.getByRole("button", { name: "ログイン", exact: true }))
        .toBeVisible();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useUserStore.getState().user).toBeNull();
      expect(
        fetchMock.mock.calls.filter(([url]) =>
          String(url).endsWith("/auth/logout"),
        ),
      ).toHaveLength(1);
      await expect
        .element(page.getByRole("alert"))
        .toHaveTextContent(
          status === 204
            ? "ログアウトしました"
            : "サーバー側のセッションを無効化できませんでした",
        );
    },
  );
  it("ユーザー情報の遅い応答でログアウト後の表示を戻さない", async () => {
    useAuthStore.getState().startSession("token");
    const pending = deferred<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockReturnValue(pending.promise),
    );
    await render(
      <TestProviders>
        <Header />
      </TestProviders>,
    );
    useAuthStore.getState().clearAuth();
    await expect
      .element(page.getByRole("button", { name: "ログイン", exact: true }))
      .toBeVisible();
    pending.resolve(
      Response.json({ id: "owner", display_name: "古い応答", icon_url: "" }),
    );
    await page.getByRole("img", { name: "logo-image" }).click();
    expect(useUserStore.getState().user).toBeNull();
  });
});
