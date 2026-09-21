import { describe, expect, it } from "vitest";

import {
  cloneWorkEditorValues,
  EMPTY_WORK_EDITOR_VALUES,
} from "../editorAsset";
import { buildWorkUpdatePayload, toWorkPayload } from "./toWorkPayload";

import { createEditorAsset } from "@/test/fixtures";

describe("作品のAPI payload", () => {
  it("APIのsnake_caseに変換し未完了アセットを含めない", () => {
    const values = {
      ...cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
      title: "作品",
      tags: [{ id: "tag", name: "タグ" }],
      thumbnail: createEditorAsset({ assetID: "thumb" }),
      assets: [
        createEditorAsset(),
        createEditorAsset({ assetID: null, status: "uploading" }),
      ],
    };
    expect(toWorkPayload(values)).toEqual({
      title: "作品",
      description: "",
      visibility: "draft",
      tag_ids: ["tag"],
      asset_ids: ["asset-1"],
      thumbnail_asset_id: "thumb",
      urls: [],
    });
  });
  it("変更なしは空のPATCH", () => {
    expect(
      buildWorkUpdatePayload(
        cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
        EMPTY_WORK_EDITOR_VALUES,
      ),
    ).toEqual({});
  });
  it("削除を空文字・空配列で明示し、未変更フィールドを送らない", () => {
    const baseline = {
      ...cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
      title: "前",
      description: "説明",
      tags: [{ id: "tag", name: "タグ" }],
      urls: ["https://example.com"],
      assets: [createEditorAsset()],
      thumbnail: createEditorAsset(),
    };
    expect(buildWorkUpdatePayload(EMPTY_WORK_EDITOR_VALUES, baseline)).toEqual({
      title: "",
      description: "",
      tag_ids: [],
      urls: [],
      asset_ids: [],
      thumbnail_asset_id: "",
    });
  });
  it("順序変更を保存するが表示名のみの変更は送らない", () => {
    const baseline = {
      ...cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
      tags: [{ id: "a", name: "旧名" }],
      urls: ["https://a.test", "https://b.test"],
    };
    const current = {
      ...baseline,
      tags: [{ id: "a", name: "新名" }],
      urls: [...baseline.urls].reverse(),
    };
    expect(buildWorkUpdatePayload(current, baseline)).toEqual({
      urls: ["https://b.test", "https://a.test"],
    });
  });
  it.each(["public", "private", "draft"] as const)(
    "公開範囲 %s",
    (visibility) => {
      const baseline = {
        ...cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
        visibility: "private" as const,
      };
      expect(
        buildWorkUpdatePayload({ ...baseline, visibility }, baseline),
      ).toEqual(visibility === "private" ? {} : { visibility });
    },
  );
});
