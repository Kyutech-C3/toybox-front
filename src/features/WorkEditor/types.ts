import type { WorkVisibility } from "@/shared/types/work";

export type WorkEditorMode = "new" | "edit";

export type AssetKind = "画像" | "動画" | "音声" | "ZIP";

export type AssetUploadStatus = "uploading" | "success" | "error";

export type EditorAsset = {
  key: string;
  assetID: string | null;
  previewURL: string | null;
  fileName: string;
  kind: AssetKind;
  status: AssetUploadStatus;
  file: File | null;
  errorMessage: string;
};

export type EditorTag = {
  id: string;
  name: string;
};

export type WorkEditorValues = {
  title: string;
  description: string;
  visibility: WorkVisibility;
  tags: EditorTag[];
  urls: string[];
  thumbnail: EditorAsset | null;
  assets: EditorAsset[];
};
