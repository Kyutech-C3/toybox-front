import { describe, expect, it, vi } from "vitest";

import {
  createWorkEditorStore,
  selectHasUnsettledBackendWork,
  selectIsDirty,
  selectIsUploading,
  selectOrphanedBackendResources,
  selectPendingBackendResources,
} from "./createWorkEditorStore";

import { createEditorAsset, createWork } from "@/test/fixtures";

describe("編集セッション", () => {
  it("同じ作品の再取得で入力を消さず、別作品と新規へは初期化する", () => {
    const store = createWorkEditorStore();
    store.getState().initializeForEdit(createWork());
    store.getState().setTitle("編集中");
    store.getState().initializeForEdit(createWork());
    expect(store.getState().current.title).toBe("編集中");
    expect(selectIsDirty(store.getState())).toBe(true);
    store
      .getState()
      .initializeForEdit(createWork({ id: "other", title: "別作品" }));
    expect(store.getState().current.title).toBe("別作品");
    expect(selectIsDirty(store.getState())).toBe(false);
    store.getState().initializeForNew();
    expect(store.getState()).toMatchObject({
      mode: "new",
      workID: null,
      ownerID: null,
      current: { title: "", visibility: "draft" },
    });
    store.getState().setTitle("新規編集中");
    store.getState().initializeForNew();
    expect(store.getState().current.title).toBe("新規編集中");
  });
  it("複数エディタとbaselineの状態を共有しない", () => {
    const first = createWorkEditorStore();
    const second = createWorkEditorStore();
    first.getState().initializeForNew();
    second.getState().initializeForNew();
    first.getState().addTag({ id: "a", name: "A" });
    first.getState().setTitle("変更");
    expect(second.getState().current.tags).toEqual([]);
    expect(first.getState().baseline.title).toBe("");
    first.getState().markSaved();
    expect(selectIsDirty(first.getState())).toBe(false);
    first.getState().setDescription("説明");
    expect(selectIsDirty(first.getState())).toBe(true);
  });
  it("タグはIDで重複排除し作成中・失敗名は大小文字を区別しない", () => {
    const store = createWorkEditorStore();
    const actions = store.getState();
    actions.addTag({ id: "a", name: "同名" });
    actions.addTag({ id: "b", name: "同名" });
    actions.addTag({ id: "a", name: "別名" });
    actions.removeTag("a");
    expect(store.getState().current.tags).toEqual([{ id: "b", name: "同名" }]);
    actions.addCreatingTagName("React");
    actions.addCreatingTagName("react");
    actions.addFailedTagName("Vue");
    actions.addFailedTagName("vue");
    expect(store.getState().creatingTagNames).toEqual(["React"]);
    expect(store.getState().failedTagNames).toEqual(["Vue"]);
    actions.removeCreatingTagName("REACT");
    actions.removeFailedTagName("VUE");
    expect(selectHasUnsettledBackendWork(store.getState())).toBe(false);
  });
  it("使用中の通常アセット・サムネイル・タグを孤立リソースとして削除しない", () => {
    const store = createWorkEditorStore();
    const actions = store.getState();
    for (const id of ["asset-1", "thumb", "unused", "unused"])
      actions.addUploadedAssetID(id);
    actions.addAssets([createEditorAsset()]);
    actions.setThumbnail(createEditorAsset({ assetID: "thumb" }));
    actions.addCreatedTagID("tag");
    actions.addCreatedTagID("orphan");
    actions.addCreatedTagID("orphan");
    actions.addTag({ id: "tag", name: "タグ" });
    expect(selectPendingBackendResources(store.getState())).toEqual({
      assetIDs: ["asset-1", "thumb", "unused"],
      tagIDs: ["tag", "orphan"],
    });
    expect(selectOrphanedBackendResources(store.getState())).toEqual({
      assetIDs: ["unused"],
      tagIDs: ["orphan"],
    });
    actions.clearPendingBackendResources();
    expect(selectPendingBackendResources(store.getState())).toEqual({
      assetIDs: [],
      tagIDs: [],
    });
  });
  it.each(["uploading", "error"] as const)(
    "%sのアセットがあれば保存未完了",
    (status) => {
      const store = createWorkEditorStore();
      store
        .getState()
        .addAssets([createEditorAsset({ status, assetID: null })]);
      expect(selectHasUnsettledBackendWork(store.getState())).toBe(true);
      expect(selectIsDirty(store.getState())).toBe(true);
      expect(selectIsUploading(store.getState())).toBe(status === "uploading");
    },
  );
  it("削除とreset時にblobを解放し処理状態を初期化する", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const store = createWorkEditorStore();
    const actions = store.getState();
    actions.addAssets([createEditorAsset({ previewURL: "blob:asset" })]);
    actions.removeAsset("missing");
    actions.removeAsset("asset:asset-1");
    expect(revoke).toHaveBeenCalledWith("blob:asset");
    actions.setThumbnail(createEditorAsset({ previewURL: "blob:thumb" }));
    actions.setIsSubmitting(true);
    actions.setHasInvalidUrls(true);
    actions.addFailedTagName("失敗");
    actions.resetEditor();
    expect(revoke).toHaveBeenCalledWith("blob:thumb");
    expect(store.getState()).toMatchObject({
      initializedKey: null,
      isSubmitting: false,
      hasInvalidUrls: false,
      failedTagNames: [],
      current: { thumbnail: null, assets: [] },
    });
  });
  it("保存完了で未保存アセットを除去しURL数を制限する", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const store = createWorkEditorStore();
    store
      .getState()
      .setUrls(
        Array.from({ length: 12 }, (_, i) => `https://example.com/${i}`),
      );
    expect(store.getState().current.urls).toHaveLength(5);
    store.getState().addAssets([
      createEditorAsset(),
      createEditorAsset({
        key: "pending",
        assetID: null,
        previewURL: "blob:pending",
      }),
    ]);
    store.getState().markSaved();
    expect(store.getState().current.assets).toHaveLength(1);
    expect(revoke).toHaveBeenCalledWith("blob:pending");
    expect(selectIsDirty(store.getState())).toBe(false);
  });
});
