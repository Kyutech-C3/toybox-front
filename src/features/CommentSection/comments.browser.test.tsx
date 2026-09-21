import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import CommentSection from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

const COMMENT = {
  id: "comment",
  content: "既存コメント",
  reply_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  user: { id: "owner", display_name: "作者", avatar_url: "" },
};

describe("コメントの投稿と返信", () => {
  it("未ログインの空状態は入力・返信操作を表示しない", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    await render(
      <TestProviders>
        <CommentSection postId="work" />
      </TestProviders>,
    );
    await expect
      .element(page.getByText("まだコメントはありません。"))
      .toBeVisible();
    await expect.element(page.getByRole("textbox")).not.toBeInTheDocument();
    await expect
      .element(page.getByText("コメントするにはログインしてください。"))
      .toBeVisible();
  });
  it("送信中は入力と二重送信を止め、成功後に再取得・入力消去", async () => {
    useAuthStore.getState().startSession("token");
    const pending = deferred<Response>();
    let comments = [COMMENT];
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) =>
        init?.method === "POST" ? pending.promise : Response.json(comments),
      );
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <CommentSection postId="work" />
      </TestProviders>,
    );
    const input = page.getByRole("textbox", { name: "コメントを入力" });
    await input.fill("   ");
    await expect
      .element(page.getByRole("button", { name: "送信", exact: true }))
      .toBeDisabled();
    await input.fill(" 新しいコメント ");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await expect.element(input).toBeDisabled();
    await expect
      .element(page.getByRole("button", { name: "送信中..." }))
      .toBeDisabled();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
    const body = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    )?.[1]?.body;
    expect(JSON.parse(String(body))).toEqual({ content: "新しいコメント" });
    comments = [
      ...comments,
      { ...COMMENT, id: "new", content: "新しいコメント" },
    ];
    pending.resolve(Response.json(comments[1]));
    await expect.element(input).toHaveValue("");
    await expect
      .element(page.getByText("新しいコメント", { exact: true }))
      .toBeVisible();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "GET"),
    ).toHaveLength(2);
  });
  it("失敗時は入力を保持し再送できる", async () => {
    useAuthStore.getState().startSession("token");
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockImplementation(async (_url, init) =>
          init?.method === "POST"
            ? Response.json({}, { status: 500 })
            : Response.json([]),
        ),
    );
    await render(
      <TestProviders>
        <CommentSection postId="work" />
      </TestProviders>,
    );
    const input = page.getByRole("textbox", { name: "コメントを入力" });
    await input.fill("消さないで");
    await page.getByRole("button", { name: "送信", exact: true }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("コメントを送信できませんでした");
    await expect.element(input).toHaveValue("消さないで");
    await expect.element(input).toBeEnabled();
  });
  it("返信の親IDを送信し、キャンセルで返信入力を閉じる", async () => {
    useAuthStore.getState().startSession("token");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) =>
        Response.json(init?.method === "POST" ? {} : [COMMENT]),
      );
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <TestProviders>
        <CommentSection postId="work" />
      </TestProviders>,
    );
    await page.getByRole("button", { name: "返信", exact: true }).click();
    const inputs = page.getByRole("textbox", { name: "コメントを入力" });
    await expect.element(inputs.nth(0)).toHaveFocus();
    await inputs.nth(0).fill("返信内容");
    await page
      .getByRole("button", { name: "送信", exact: true })
      .nth(0)
      .click();
    await expect
      .poll(
        () =>
          fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")
            .length,
      )
      .toBe(1);
    expect(
      JSON.parse(
        String(
          fetchMock.mock.calls.find(([, init]) => init?.method === "POST")?.[1]
            ?.body,
        ),
      ),
    ).toEqual({ content: "返信内容", reply_at: "comment" });
    await page.getByRole("button", { name: "返信", exact: true }).click();
    await page.getByRole("button", { name: "返信をキャンセル" }).nth(0).click();
    await expect
      .element(page.getByRole("button", { name: "返信中" }))
      .not.toBeInTheDocument();
  });
});
