import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import { createWorkEditorStore } from "./store/createWorkEditorStore";
import WORK_EDITOR_STORE_CONTEXT from "./store/workEditorStoreContext";
import useWorkTags from "./WorkDetailForm/hook/useWorkTags";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

const TagsHarness = () => {
  const tags = useWorkTags();
  return (
    <>
      <button type="button" onClick={() => void tags.handleAddTag("React")}>
        既存追加
      </button>
      <button type="button" onClick={() => void tags.handleAddTag("New")}>
        新規追加
      </button>
      <button type="button" onClick={() => void tags.handleRetryTag("New")}>
        再試行
      </button>
      <p>{tags.tagError}</p>
      <output>{JSON.stringify(tags.tags)}</output>
    </>
  );
};
const setup = async () => {
  useAuthStore.getState().startSession("token");
  const store = createWorkEditorStore();
  store.getState().initializeForNew();
  const view = await render(
    <TestProviders>
      <WORK_EDITOR_STORE_CONTEXT.Provider value={store}>
        <TagsHarness />
      </WORK_EDITOR_STORE_CONTEXT.Provider>
    </TestProviders>,
  );
  return { store, ...view };
};

describe("作品タグ作成", () => {
  it("既存タグを大小文字を区別せず再利用し作成APIを呼ばない", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        Response.json({ tags: [{ id: "existing", name: "react" }] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    await page.getByRole("button", { name: "既存追加" }).click();
    await expect
      .poll(() => store.getState().current.tags)
      .toEqual([{ id: "existing", name: "react" }]);
    await page.getByRole("button", { name: "既存追加" }).click();
    expect(store.getState().current.tags).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().createdTagIDs).toEqual([]);
  });
  it("新規作成失敗を再試行し失敗状態を解消", async () => {
    let attempts = 0;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        if (init?.method === "POST")
          return ++attempts === 1
            ? Response.json({}, { status: 500 })
            : Response.json({ id: "new", name: "new" });
        return Response.json({ tags: [] });
      });
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    await page.getByRole("button", { name: "新規追加" }).click();
    await expect
      .element(page.getByText("タグの作成に失敗しました。再試行してください。"))
      .toBeVisible();
    await page.getByRole("button", { name: "再試行" }).click();
    await expect
      .poll(() => store.getState().current.tags)
      .toEqual([{ id: "new", name: "new" }]);
    expect(store.getState().failedTagNames).toEqual([]);
    expect(store.getState().createdTagIDs).toEqual(["new"]);
  });
  it("作成中の連打を抑え、reset後の完了を破棄し新規リソースを片付ける", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) =>
        init?.method === "POST"
          ? pending.promise
          : init?.method === "DELETE"
            ? new Response(null, { status: 204 })
            : Response.json({ tags: [] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    await page.getByRole("button", { name: "新規追加" }).click();
    await page.getByRole("button", { name: "新規追加" }).click();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
    store.getState().resetEditor();
    store.getState().initializeForNew();
    pending.resolve(Response.json({ id: "stale", name: "new" }));
    await expect
      .poll(() =>
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).endsWith("/auth/tags/stale") &&
            init?.method === "DELETE",
        ),
      )
      .toBe(true);
    expect(store.getState().current.tags).toEqual([]);
    expect(store.getState().createdTagIDs).toEqual([]);
    expect(store.getState().creatingTagNames).toEqual([]);
  });
});
