import type { EditorAsset } from "@/features/WorkEditor/types";
import type { Work } from "@/shared/types/work";

export const createWork = (overrides: Partial<Work> = {}): Work => ({
  id: "work-1",
  title: "テスト作品",
  description: "作品の説明",
  description_html: "",
  user: { id: "owner", display_name: "作者", avatar_url: "" },
  assets: [],
  tags: [],
  thumbnail_url: "https://example.com/thumb.png",
  thumbnail_asset_id: "thumbnail",
  is_favorite: false,
  visibility: "public",
  urls: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const createEditorAsset = (
  overrides: Partial<EditorAsset> = {},
): EditorAsset => ({
  key: "asset:asset-1",
  assetID: "asset-1",
  fileName: "photo.png",
  kind: "画像",
  previewURL: "https://example.com/photo.png",
  status: "success",
  file: null,
  errorMessage: "",
  ...overrides,
});

export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};
