import type { WorkRequestData } from "@/shared/types/work";
import type { WorkEditorValues } from "../types";

/**
 * エディタの編集値を API のリクエストボディへ変換する純粋関数。
 * store は camelCase のドメイン表現、API は snake_case なので、
 * 変換はこの API 境界だけで行う。
 *
 * 差分判定の準備:
 * 将来 PATCH で変更フィールドだけを送る場合は、
 * toWorkPayload(current) と toWorkPayload(baseline) を比較して差分を取る。
 * File や blob URL を含む生の store の値ではなく、
 * この関数の結果同士を比較すること（比較が安定するため）。
 * 今回は差分を取らず、全フィールドを送信する。
 */
export const toWorkPayload = (values: WorkEditorValues): WorkRequestData => ({
  title: values.title,
  description: values.description,
  visibility: values.visibility,
  tag_ids: values.tags.map((tag) => tag.id),
  // アップロード未完了（assetID が null）のアセットは送信対象から除外する
  asset_ids: values.assets
    .map((asset) => asset.assetID)
    .filter((assetID): assetID is string => assetID !== null),
  thumbnail_asset_id: values.thumbnail?.assetID ?? "",
  urls: values.urls,
});
