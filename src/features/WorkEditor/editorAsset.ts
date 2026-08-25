import type { Asset, Work, WorkVisibility } from "@/shared/types/work";
import type { AssetKind, EditorAsset, WorkEditorValues } from "./types";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".bmp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".mov"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a"];

const WORK_VISIBILITIES: WorkVisibility[] = ["public", "private", "draft"];

export const EMPTY_WORK_EDITOR_VALUES: WorkEditorValues = {
  title: "",
  description: "",
  visibility: "draft",
  tags: [],
  urls: [],
  thumbnail: null,
  assets: [],
};

export const getExtension = (fileName: string) =>
  `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;

export const getAssetKind = (fileName: string): AssetKind => {
  const extension = getExtension(fileName);
  if (IMAGE_EXTENSIONS.includes(extension)) return "画像";
  if (VIDEO_EXTENSIONS.includes(extension)) return "動画";
  if (AUDIO_EXTENSIONS.includes(extension)) return "音声";
  return "ZIP";
};

export const canPreviewAsset = (kind: AssetKind) =>
  kind === "画像" || kind === "動画";

export const getFileAssetKey = (file: File) =>
  `file:${file.name}:${file.size}:${file.lastModified}`;

const getFileNameFromURL = (url: string) => {
  const path = url.split("?")[0];
  return path.split("/").pop() || url;
};

/** サーバー上の URL は解放不要。blob URL だけを解放する */
export const revokePreviewURL = (previewURL: string | null) => {
  if (previewURL?.startsWith("blob:")) URL.revokeObjectURL(previewURL);
};

export const revokeValuesPreviewURLs = (values: WorkEditorValues) => {
  revokePreviewURL(values.thumbnail?.previewURL ?? null);
  for (const asset of values.assets) revokePreviewURL(asset.previewURL);
};

const toEditorAssetFromAsset = (asset: Asset): EditorAsset => {
  const fileName = getFileNameFromURL(asset.url);
  return {
    key: `asset:${asset.id}`,
    assetID: asset.id,
    previewURL: asset.url,
    fileName,
    kind: getAssetKind(fileName),
    status: "success",
    file: null,
    errorMessage: "",
  };
};

export const createUploadingAsset = (file: File): EditorAsset => ({
  key: getFileAssetKey(file),
  assetID: null,
  previewURL: canPreviewAsset(getAssetKind(file.name))
    ? URL.createObjectURL(file)
    : null,
  fileName: file.name,
  kind: getAssetKind(file.name),
  status: "uploading",
  file,
  errorMessage: "",
});

const toWorkVisibility = (visibility: string): WorkVisibility =>
  WORK_VISIBILITIES.find((candidate) => candidate === visibility) ?? "draft";

const toThumbnailAsset = (work: Work): EditorAsset | null => {
  if (!work.thumbnail_asset_id) return null;
  const fileName = getFileNameFromURL(work.thumbnail_url);
  return {
    key: `asset:${work.thumbnail_asset_id}`,
    assetID: work.thumbnail_asset_id,
    previewURL: work.thumbnail_url,
    fileName,
    kind: "画像",
    status: "success",
    file: null,
    errorMessage: "",
  };
};

/** API の Work をエディタの編集値に変換する */
export const toWorkEditorValues = (work: Work): WorkEditorValues => ({
  title: work.title,
  description: work.description,
  visibility: toWorkVisibility(work.visibility),
  tags: work.tags.map((tag) => ({ id: tag.id, name: tag.name })),
  urls: [...(work.urls ?? [])],
  thumbnail: toThumbnailAsset(work),
  assets: (work.assets ?? [])
    .filter((asset) => asset.id !== work.thumbnail_asset_id)
    .map(toEditorAssetFromAsset),
});

/** baseline を current と切り離して保持するための浅いコピー */
export const cloneWorkEditorValues = (
  values: WorkEditorValues,
): WorkEditorValues => ({
  ...values,
  tags: values.tags.map((tag) => ({ ...tag })),
  urls: [...values.urls],
  thumbnail: values.thumbnail ? { ...values.thumbnail } : null,
  assets: values.assets.map((asset) => ({ ...asset })),
});
