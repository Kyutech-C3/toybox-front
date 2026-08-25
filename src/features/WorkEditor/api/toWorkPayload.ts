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
