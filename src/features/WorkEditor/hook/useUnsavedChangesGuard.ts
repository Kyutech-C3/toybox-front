import { useCallback } from "react";

import { deletePendingResources } from "../api/deletePendingResources";
import {
  selectIsDirty,
  selectPendingBackendResources,
  useWorkEditorStoreApi,
} from "../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import useSharedUnsavedChangesGuard from "@/shared/hook/useUnsavedChangesGuard";

function useUnsavedChangesGuard(): void {
  const storeApi = useWorkEditorStoreApi();
  const getHasUnsavedChanges = useCallback(() => {
    const state = storeApi.getState();
    if (state.initializedKey === null) return false;

    return selectIsDirty(state);
  }, [storeApi]);
  const discardPendingResources = useCallback(() => {
    const state = storeApi.getState();
    const resources = selectPendingBackendResources(state);
    if (resources.assetIDs.length === 0 && resources.tagIDs.length === 0) {
      return;
    }
    state.clearPendingBackendResources();

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;
    void deletePendingResources(resources, accessToken);
  }, [storeApi]);

  useSharedUnsavedChangesGuard({
    getHasUnsavedChanges,
    onDiscard: discardPendingResources,
  });
}

export default useUnsavedChangesGuard;
