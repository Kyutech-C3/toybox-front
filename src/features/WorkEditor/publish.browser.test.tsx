import { useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import PublishButton from "./PublishButtons/PublishButton";
import {
  createWorkEditorStore,
  selectIsDirty,
} from "./store/createWorkEditorStore";
import WORK_EDITOR_STORE_CONTEXT from "./store/workEditorStoreContext";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { createEditorAsset, createWork, deferred } from "@/test/fixtures";
import { render, TestProviders } from "@/test/render";

const Location = () => (
  <output aria-label="現在のパス">{useLocation().pathname}</output>
);
const setup = async (isEdit = false) => {
  useAuthStore.getState().startSession("token");
  const store = createWorkEditorStore();
  if (isEdit)
    store.getState().initializeForEdit(createWork({ visibility: "draft" }));
  else {
    store.getState().initializeForNew();
    store.getState().setTitle("新規作品");
    store.getState().setDescription("説明");
    store.getState().setThumbnail(createEditorAsset({ assetID: "thumb" }));
  }
  await render(
    <TestProviders>
      <WORK_EDITOR_STORE_CONTEXT.Provider value={store}>
        <PublishButton />
        <Location />
      </WORK_EDITOR_STORE_CONTEXT.Provider>
    </TestProviders>,
  );
  return store;
};

describe("作品の保存", () => {
  it("下書きのPOST本文と成功時のdirty解除", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ id: "new" }));
    vi.stubGlobal("fetch", fetchMock);
    const store = await setup();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("作品を投稿しました");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      title: "新規作品",
      description: "説明",
      visibility: "draft",
      asset_ids: [],
      tag_ids: [],
      thumbnail_asset_id: "thumb",
      urls: [],
    });
    expect(selectIsDirty(store.getState())).toBe(false);
  });
  it("編集は変更フィールドのみPATCHし詳細へ遷移", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(createWork({ title: "変更後" })));
    vi.stubGlobal("fetch", fetchMock);
    const store = await setup(true);
    store.getState().setTitle("変更後");
    await page.getByRole("button", { name: /下書き/ }).click();
    await expect
      .element(page.getByRole("status", { name: "現在のパス" }))
      .toHaveTextContent("/works/work-1");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      title: "変更後",
    });
    expect(selectIsDirty(store.getState())).toBe(false);
  });
  it("変更なしではPATCHしない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await setup(true);
    await page.getByRole("button", { name: /下書き/ }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("変更はありません");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([403, 404, 409, 500])(
    "保存失敗 %i は入力とdirty状態を保持",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json({}, { status })),
      );
      const store = await setup(true);
      store.getState().setTitle("保持するタイトル");
      await page.getByRole("button", { name: /下書き/ }).click();
      await expect.element(page.getByRole("alert")).toBeVisible();
      expect(store.getState().current.title).toBe("保持するタイトル");
      expect(selectIsDirty(store.getState())).toBe(true);
      await expect
        .element(page.getByRole("button", { name: /下書き/ }))
        .toBeEnabled();
    },
  );
  it("サムネイル未設定とURL不正は送信しない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const store = await setup();
    store.getState().removeThumbnail();
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("サムネイルのアップロードを完了してください");
    store.getState().setHasInvalidUrls(true);
    await expect
      .element(page.getByRole("button", { name: "下書き保存" }))
      .toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("公開確認をキャンセルすると送信しない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const store = await setup();
    store.getState().setVisibility("public");
    await page.getByRole("button", { name: /全体公開/ }).click();
    expect(confirm).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("送信中とアップロード失敗中は保存できない", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    const store = await setup();
    store
      .getState()
      .addAssets([createEditorAsset({ status: "error", assetID: null })]);
    await expect
      .element(page.getByRole("button", { name: "下書き保存" }))
      .toBeDisabled();
    store.getState().removeAsset("asset:asset-1");
    await page.getByRole("button", { name: "下書き保存" }).click();
    await expect
      .element(page.getByRole("button", { name: "下書き保存" }))
      .toBeDisabled();
    expect(fetchMock).toHaveBeenCalledOnce();
    pending.resolve(Response.json({ id: "new" }));
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("作品を投稿しました");
  });
});
