import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import useUnsavedChangesGuard from "./hook/useUnsavedChangesGuard";
import { createWorkEditorStore } from "./store/createWorkEditorStore";
import WORK_EDITOR_STORE_CONTEXT from "./store/workEditorStoreContext";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { render } from "@/test/render";

const GuardHarness = () => {
  useUnsavedChangesGuard();
  return (
    <>
      <h1>編集</h1>
      <Link to="/next">離れる</Link>
      <Link to="/edit?page=2">クエリ変更</Link>
    </>
  );
};
const setup = async () => {
  useAuthStore.getState().startSession("token");
  const store = createWorkEditorStore();
  store.getState().initializeForNew();
  const router = createMemoryRouter(
    [
      { path: "/edit", element: <GuardHarness /> },
      { path: "/next", element: <h1>次のページ</h1> },
    ],
    { initialEntries: ["/edit"] },
  );
  await render(
    <WORK_EDITOR_STORE_CONTEXT.Provider value={store}>
      <RouterProvider router={router} />
    </WORK_EDITOR_STORE_CONTEXT.Provider>,
  );
  return { store, router };
};

describe("未保存変更の保護", () => {
  it("変更なしなら確認せず遷移", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await setup();
    await page.getByRole("link", { name: "離れる" }).click();
    await expect
      .element(page.getByRole("heading", { name: "次のページ" }))
      .toBeVisible();
    expect(confirm).not.toHaveBeenCalled();
  });
  it("変更ありはキャンセルで留まり、破棄承認で未保存リソースを削除", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { store } = await setup();
    store.getState().setTitle("変更");
    store.getState().addUploadedAssetID("pending");
    store.getState().addCreatedTagID("tag");
    await page.getByRole("link", { name: "離れる" }).click();
    await expect
      .element(page.getByRole("heading", { name: "編集" }))
      .toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await page.getByRole("link", { name: "離れる" }).click();
    await expect
      .element(page.getByRole("heading", { name: "次のページ" }))
      .toBeVisible();
    expect(
      fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname).sort(),
    ).toEqual(["/auth/tags/tag", "/auth/works/asset/pending"]);
    expect(store.getState().uploadedAssetIDs).toEqual([]);
    expect(store.getState().createdTagIDs).toEqual([]);
  });
  it("同じpathname内はブロックせず、未保存時だけbeforeunloadを取り消す", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { store } = await setup();
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
    store.getState().setTitle("変更");
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    await page.getByRole("link", { name: "クエリ変更" }).click();
    expect(confirm).not.toHaveBeenCalled();
  });
});
