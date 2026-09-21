import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import App from "@/App";
import { useTagsStore } from "@/features/WorkIndex/SearchBar/store/useTagsStore";
import { useWorkPageSizeStore } from "@/shared/ui/WorkCardGrid/store/useWorkPageSizeStore";
import { createWork, deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

const mockAPI = (
  override?: (url: URL) => Response | Promise<Response> | undefined,
) => {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = new URL(String(input));
    const response = override?.(url);
    if (response) return response;
    if (url.pathname === "/tags") return Response.json({ tags: [] });
    if (url.pathname === "/works")
      return Response.json({
        works: [createWork({ thumbnail_url: "" })],
        total_count: 1,
        page: 1,
        limit: 30,
      });
    if (url.pathname === "/works/work-1") return Response.json(createWork());
    if (url.pathname.endsWith("/comments")) return Response.json([]);
    if (url.pathname.endsWith("/favorite")) return Response.json({ total: 0 });
    if (url.pathname === "/users/owner")
      return Response.json({
        id: "owner",
        display_name: "作者",
        profile: "自己紹介",
        avatar_url: "",
        github_id: "git-name",
        twitter_id: "",
      });
    throw new Error(`Unexpected API: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const setup = async (path = "/") => {
  useTagsStore.setState({ tags: [] });
  useWorkPageSizeStore.setState({ pageSize: 30 });
  await render(
    <TestProviders initialEntries={[path]}>
      <App />
    </TestProviders>,
  );
};

describe("主要ページのAPI連携", () => {
  it("一覧から作品詳細へ移動し本文とコメント空状態を表示", async () => {
    const fetchMock = mockAPI();
    await setup();
    await page.getByRole("link", { name: "テスト作品", exact: true }).click();
    await expect
      .element(page.getByRole("heading", { name: "テスト作品", exact: true }))
      .toBeVisible();
    await expect.element(page.getByText("作品の説明")).toBeVisible();
    await expect
      .element(page.getByText("まだコメントはありません。"))
      .toBeVisible();
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/works?page=1&limit=30"),
      ),
    ).toBe(true);
  });
  it("正常な空一覧を通信エラーとして表示しない", async () => {
    mockAPI((url) =>
      url.pathname === "/works"
        ? Response.json({ works: [], total_count: 0, page: 1, limit: 30 })
        : undefined,
    );
    await setup();
    await expect.element(page.getByText("作品はありません。")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "再試行" }))
      .not.toBeInTheDocument();
  });
  it("一覧取得失敗後、同じURLで再試行して復帰", async () => {
    let hasFailed = false;
    mockAPI((url) => {
      if (url.pathname === "/works" && !hasFailed) {
        hasFailed = true;
        return Response.json({}, { status: 500 });
      }
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await setup();
    await expect
      .element(
        page.getByRole("heading", { name: "サーバーで問題が発生しました" }),
      )
      .toBeVisible();
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await expect
      .element(page.getByRole("link", { name: "テスト作品", exact: true }))
      .toBeVisible();
  });
  it.each([
    [404, "作品が見つかりません"],
    [403, "この操作を行う権限がありません"],
  ] as const)("作品への直接URLで %i を区別", async (status, message) => {
    mockAPI((url) =>
      url.pathname === "/works/missing"
        ? Response.json({}, { status })
        : undefined,
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await setup("/works/missing");
    await expect
      .element(page.getByRole("heading", { name: message }))
      .toBeVisible();
  });
  it("作品取得中はloadingを表示", async () => {
    const pending = deferred<Response>();
    mockAPI((url) =>
      url.pathname === "/works/work-1" ? pending.promise : undefined,
    );
    await setup("/works/work-1");
    await expect.element(page.getByRole("status")).toBeVisible();
    pending.resolve(Response.json(createWork()));
    await expect
      .element(page.getByRole("heading", { name: "テスト作品", exact: true }))
      .toBeVisible();
  });
  it("プロフィールは30件固定でページを切り替える", async () => {
    const fetchMock = mockAPI((url) =>
      url.pathname === "/works/users/owner"
        ? Response.json({
            works: [
              createWork({
                title: `作品${url.searchParams.get("page")}`,
                thumbnail_url: "",
              }),
            ],
            total_count: 31,
            page: Number(url.searchParams.get("page")),
            limit: 30,
          })
        : undefined,
    );
    await setup("/users/owner");
    await expect
      .element(page.getByRole("heading", { name: "作者", exact: true }))
      .toBeVisible();
    await page.getByRole("button", { name: "ページ 2", exact: true }).click();
    await expect
      .element(page.getByRole("link", { name: "作品2", exact: true }))
      .toBeVisible();
    expect(
      fetchMock.mock.calls
        .filter(([url]) => String(url).includes("/works/users/"))
        .every(
          ([url]) => new URL(String(url)).searchParams.get("limit") === "30",
        ),
    ).toBe(true);
    await expect
      .element(page.getByRole("button", { name: "プロフィールを編集" }))
      .not.toBeInTheDocument();
  });
  it("プロフィールの範囲外ページを最終ページへ戻す", async () => {
    const fetchMock = mockAPI((url) =>
      url.pathname === "/works/users/owner"
        ? Response.json({
            works: [],
            total_count: 0,
            page: Number(url.searchParams.get("page")),
            limit: 30,
          })
        : undefined,
    );
    await setup("/users/owner?page=9");
    await expect.element(page.getByText("作品はありません。")).toBeVisible();
    await expect
      .poll(() =>
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("/works/users/owner?page=1&limit=30"),
        ),
      )
      .toBe(true);
  });
  it("未定義URLは404画面を表示", async () => {
    mockAPI();
    await setup("/unknown/path");
    await expect
      .element(page.getByRole("heading"))
      .toHaveTextContent("ページが見つかりません");
  });
  it("タグ選択と表示件数をAPIクエリへ反映", async () => {
    const fetchMock = mockAPI((url) =>
      url.pathname === "/tags"
        ? Response.json({
            tags: [
              {
                id: "react-tag",
                name: "React",
                created_at: "",
                updated_at: "",
              },
            ],
          })
        : undefined,
    );
    await setup();
    const input = page.getByRole("combobox", { name: "タグで絞り込み" });
    await input.fill("re");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect
      .poll(() =>
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("tag_ids=react-tag"),
        ),
      )
      .toBe(true);
    await page
      .getByRole("radiogroup", { name: "1ページの表示件数" })
      .getByText("45件")
      .click();
    await expect
      .poll(() =>
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("limit=45&tag_ids=react-tag"),
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Remove React batch" }).click();
    await expect.poll(() => useTagsStore.getState().tags.length).toBe(0);
    await input.fill("存在しないタグ");
    await userEvent.keyboard("{Enter}");
    expect(useTagsStore.getState().tags).toEqual([]);
  });
});
