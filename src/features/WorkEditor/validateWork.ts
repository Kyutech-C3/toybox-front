import { MAX_WORK_TITLE_LENGTH } from "./constants";

import type { WorkEditorValues } from "./types";

export type WorkValidationErrors = Partial<
  Record<"title" | "description" | "tags" | "thumbnail" | "assets", string>
>;

export const validateWork = (
  values: WorkEditorValues,
): WorkValidationErrors => {
  const errors: WorkValidationErrors = {};
  if (!values.title.trim()) {
    errors.title = "タイトルを入力してください";
  } else if (Array.from(values.title).length > MAX_WORK_TITLE_LENGTH) {
    errors.title = `タイトルは${MAX_WORK_TITLE_LENGTH}文字以内で入力してください`;
  }
  if (!values.description.trim()) errors.description = "説明を入力してください";
  if (values.tags.length === 0) errors.tags = "タグを1つ以上指定してください";
  if (!values.thumbnail?.assetID) {
    errors.thumbnail = "サムネイルを追加し、アップロードを完了してください";
  }
  if (!values.assets.some((asset) => asset.assetID !== null)) {
    errors.assets = "アセットを1つ以上追加してください";
  }
  return errors;
};
