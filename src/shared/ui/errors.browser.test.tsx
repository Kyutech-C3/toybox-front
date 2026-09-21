import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import AppErrorBoundary from "./AppErrorBoundary";
import PageErrorBoundary from "./PageErrorBoundary";

import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";
import { ApiError } from "@/util/fetchData";

const Broken = () => {
  throw new ApiError(403);
};

describe("エラー境界", () => {
  it("retry完了まで無効化し成功後に内容を復帰", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const pending = deferred<void>();
    let hasError = true;
    const Content = () => {
      if (hasError) throw new ApiError(500);
      return <h1>復帰しました</h1>;
    };
    const onRetry = vi.fn(async () => {
      await pending.promise;
      hasError = false;
    });
    await render(
      <TestProviders>
        <PageErrorBoundary onRetry={onRetry}>
          <Content />
        </PageErrorBoundary>
      </TestProviders>,
    );
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "再試行中..." }))
      .toBeDisabled();
    pending.resolve();
    await expect
      .element(page.getByRole("heading", { name: "復帰しました" }))
      .toBeVisible();
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it("retry失敗はエラー画面を維持しresetKey変更で復帰", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onRetry = vi.fn().mockRejectedValue(new Error("offline"));
    const view = await render(
      <TestProviders>
        <PageErrorBoundary resetKey="first" onRetry={onRetry}>
          <Broken />
        </PageErrorBoundary>
      </TestProviders>,
    );
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "再試行", exact: true }))
      .toBeEnabled();
    await expect
      .element(
        page.getByRole("heading", { name: "この操作を行う権限がありません" }),
      )
      .toBeVisible();
    await view.rerender(
      <TestProviders>
        <PageErrorBoundary resetKey="second" onRetry={onRetry}>
          <h1>別ページ</h1>
        </PageErrorBoundary>
      </TestProviders>,
    );
    await expect
      .element(page.getByRole("heading", { name: "別ページ" }))
      .toBeVisible();
  });
  it("アプリの予期しないrender例外を捕捉", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <TestProviders>
        <AppErrorBoundary>
          <Broken />
        </AppErrorBoundary>
      </TestProviders>,
    );
    await expect.element(page.getByRole("heading")).toBeVisible();
  });
});
