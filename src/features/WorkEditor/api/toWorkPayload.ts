import type { WorkRequestData } from "@/shared/types/work";
import type { WorkEditorValues } from "../types";

export const toWorkPayload = (values: WorkEditorValues): WorkRequestData => ({
  title: values.title,
  description: values.description,
  visibility: values.visibility,
  tag_ids: values.tags.map((tag) => tag.id),
  asset_ids: values.assets
    .map((asset) => asset.assetID)
    .filter((assetID): assetID is string => assetID !== null),
  thumbnail_asset_id: values.thumbnail?.assetID ?? "",
  urls: values.urls,
});

const areStringListsEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

export const buildWorkUpdatePayload = (
  current: WorkEditorValues,
  baseline: WorkEditorValues,
): Partial<WorkRequestData> => {
  const currentPayload = toWorkPayload(current);
  const baselinePayload = toWorkPayload(baseline);
  const updatePayload: Partial<WorkRequestData> = {};

  if (currentPayload.title !== baselinePayload.title) {
    updatePayload.title = currentPayload.title;
  }
  if (currentPayload.description !== baselinePayload.description) {
    updatePayload.description = currentPayload.description;
  }
  if (currentPayload.visibility !== baselinePayload.visibility) {
    updatePayload.visibility = currentPayload.visibility;
  }
  if (
    currentPayload.thumbnail_asset_id !== baselinePayload.thumbnail_asset_id
  ) {
    updatePayload.thumbnail_asset_id = currentPayload.thumbnail_asset_id;
  }
  if (!areStringListsEqual(currentPayload.tag_ids, baselinePayload.tag_ids)) {
    updatePayload.tag_ids = currentPayload.tag_ids;
  }
  if (
    !areStringListsEqual(currentPayload.asset_ids, baselinePayload.asset_ids)
  ) {
    updatePayload.asset_ids = currentPayload.asset_ids;
  }
  if (!areStringListsEqual(currentPayload.urls, baselinePayload.urls)) {
    updatePayload.urls = currentPayload.urls;
  }

  return updatePayload;
};
