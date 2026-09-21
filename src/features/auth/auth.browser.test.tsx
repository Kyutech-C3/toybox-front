import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import AuthSessionProvider from "./AuthSessionProvider";
import { clearAuthSession } from "./auth";
import ProtectedRoute from "./ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

describe("認証UI", () => {
  it("未ログインでは保護コンテンツを表示せずログイン失敗を知らせる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status: 500 })),
    );
    await render(
      <TestProviders>
        <ProtectedRoute>
          <h1>編集フォーム</h1>
        </ProtectedRoute>
      </TestProviders>,
    );
    await expect
      .element(page.getByRole("heading", { name: "ログインが必要です" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "編集フォーム" }))
      .not.toBeInTheDocument();
    await page.getByRole("button", { name: "ログインする" }).click();
    await expect
      .element(
        page.getByText(
          "ログイン画面を開けませんでした。通信環境を確認して再試行してください。",
        ),
      )
      .toBeVisible();
  });
  it("認証済みだけ保護コンテンツを表示", async () => {
    useAuthStore.getState().startSession("token");
    await render(
      <TestProviders>
        <ProtectedRoute>
          <h1>編集フォーム</h1>
        </ProtectedRoute>
      </TestProviders>,
    );
    await expect
      .element(page.getByRole("heading", { name: "編集フォーム" }))
      .toBeVisible();
  });
  it.each([200, 401])(
    "StrictModeのセッション復元 %i を一度だけ実行し完了まで子を隠す",
    async (status) => {
      await clearAuthSession();
      useAuthStore.setState({ isInitialized: false });
      const pending = deferred<Response>();
      const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
      vi.stubGlobal("fetch", fetchMock);
      await render(
        <TestProviders>
          <StrictMode>
            <AuthSessionProvider>
              <h1>ホーム</h1>
            </AuthSessionProvider>
          </StrictMode>
        </TestProviders>,
      );
      await expect
        .element(page.getByRole("heading", { name: "ホーム" }))
        .not.toBeInTheDocument();
      await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
      pending.resolve(Response.json({ access_token: "restored" }, { status }));
      await expect
        .element(page.getByRole("heading", { name: "ホーム" }))
        .toBeVisible();
      expect(useAuthStore.getState().accessToken).toBe(
        status === 200 ? "restored" : null,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});
