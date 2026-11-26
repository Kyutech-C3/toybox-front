import { deleteAsset } from "./deleteAsset";
import { deleteTag } from "./deleteTag";

import type { PendingBackendResources } from "../store/createWorkEditorStore";

const deletePendingResources = async (
  resources: PendingBackendResources,
): Promise<void> => {
  await Promise.allSettled([
    ...resources.assetIDs.map((assetID) => deleteAsset(assetID)),
    ...resources.tagIDs.map((tagID) => deleteTag(tagID)),
  ]);
};

export { deletePendingResources };
