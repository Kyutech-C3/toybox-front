import { describe, expect, it, vi } from "vitest";

import {
  canPreviewAsset,
  cloneWorkEditorValues,
  createUploadingAsset,
  getAssetKind,
  getExtension,
  getFileAssetKey,
  revokePreviewURL,
  toWorkEditorValues,
} from "./editorAsset";

import { createWork } from "@/test/fixtures";

describe("編集用アセット", () => {
  it.each([
    ["PHOTO.PNG", "画像"],
    ["a.b.JPEG", "画像"],
    ["movie.MOV", "動画"],
    ["sound.m4a", "音声"],
    ["archive.zip", "ZIP"],
  ])("分類 %s", (name, kind) => {
    expect(getAssetKind(name)).toBe(kind);
    expect(getExtension(name)).toBe(`.${name.split(".").pop()?.toLowerCase()}`);
  });
  it("画像と動画だけプレビューを作りファイルを安定して識別する", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const file = new File(["image"], "image.png", { lastModified: 42 });
    expect(createUploadingAsset(file)).toMatchObject({
      key: getFileAssetKey(file),
      status: "uploading",
      assetID: null,
      previewURL: "blob:test",
      file,
    });
    expect(
      createUploadingAsset(new File(["zip"], "a.zip")).previewURL,
    ).toBeNull();
    expect(canPreviewAsset("音声")).toBe(false);
    expect(canPreviewAsset("動画")).toBe(true);
  });
  it("blob以外のURLは解放しない", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    revokePreviewURL(null);
    revokePreviewURL("https://example.com/a");
    revokePreviewURL("blob:test");
    expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:test");
  });
  it("サムネイルを通常アセットから分離し、署名URLのクエリを名前に含めない", () => {
    const asset = {
      id: "asset",
      url: "https://example.com/photo.PNG?signature=abc",
      asset_type: "image",
      extension: "png",
      created_at: new Date(),
      updated_at: "",
      user_id: "owner",
      work_id: "work-1",
    };
    const values = toWorkEditorValues(
      createWork({ assets: [asset, { ...asset, id: "thumbnail" }] }),
    );
    expect(values.assets).toHaveLength(1);
    expect(values.assets[0]).toMatchObject({
      assetID: "asset",
      fileName: "photo.PNG",
      kind: "画像",
      status: "success",
    });
    expect(values.thumbnail?.assetID).toBe("thumbnail");
    const clone = cloneWorkEditorValues(values);
    clone.assets[0].fileName = "changed";
    clone.urls.push("https://example.com");
    expect(values.assets[0].fileName).toBe("photo.PNG");
    expect(values.urls).toEqual([]);
    expect(clone.thumbnail).not.toBe(values.thumbnail);
  });
  it("サムネイルのない作品を変換できる", () => {
    expect(
      toWorkEditorValues(createWork({ thumbnail_asset_id: "" })).thumbnail,
    ).toBeNull();
  });
});
