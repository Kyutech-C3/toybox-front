import type { WorkVisibility } from "@/shared/types/work";

export type WorkEditorMode = "new" | "edit";

export type AssetKind = "画像" | "動画" | "音声" | "ZIP";

export type AssetUploadStatus = "uploading" | "success" | "error";

/**
 * エディタが扱うアセット 1 件。
 * 既存アセット（サーバー上の URL）と新規アップロード（blob URL）を
 * 同じ形で表すことで、表示側は両者を区別せずに描画できる。
 * previewURL には画像バイナリではなく「参照」だけを持つ。
 */
export type EditorAsset = {
  /** 一覧の React key。既存は "asset:<id>"、新規は "file:<name>:<size>:<lastModified>" */
  key: string;
  /** サーバー上の asset id。アップロード未完了なら null */
  assetID: string | null;
  /** 表示用。既存は API が返す URL、新規は URL.createObjectURL の結果 */
  previewURL: string | null;
  fileName: string;
  kind: AssetKind;
  status: AssetUploadStatus;
  /** 再アップロード用。既存アセットは null */
  file: File | null;
  errorMessage: string;
};

export type EditorTag = {
  id: string;
  name: string;
};

/** 作品の内容そのもの。差分比較・未保存判定の単位になる */
export type WorkEditorValues = {
  title: string;
  description: string;
  visibility: WorkVisibility;
  tags: EditorTag[];
  urls: string[];
  thumbnail: EditorAsset | null;
  assets: EditorAsset[];
};
