import { deleteAsset } from "./deleteAsset";
import { deleteTag } from "./deleteTag";

import type { PendingBackendResources } from "../store/createWorkEditorStore";

const deletePendingResources = async (
  resources: PendingBackendResources,
  accessToken: string,
): Promise<void> => {
  await Promise.allSettled([
    ...resources.assetIDs.map((assetID) => deleteAsset(assetID, accessToken)),
    ...resources.tagIDs.map((tagID) => deleteTag(tagID, accessToken)),
  ]);
};

export { deletePendingResources };
