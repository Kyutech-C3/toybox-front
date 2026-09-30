import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";

import { deletePendingResources } from "../api/deletePendingResources";
import {
  selectIsDirty,
  selectPendingBackendResources,
  useWorkEditorStoreApi,
} from "../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { BlockerFunction } from "react-router-dom";

const LEAVE_CONFIRM_MESSAGE =
  "保存していない変更があります。このページを離れると、編集した内容は失われます。";

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

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (currentLocation.pathname === nextLocation.pathname) return false;
      if (!getHasUnsavedChanges()) return false;

      if (!window.confirm(LEAVE_CONFIRM_MESSAGE)) return true;

      discardPendingResources();
      return false;
    },
    [getHasUnsavedChanges, discardPendingResources],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!getHasUnsavedChanges()) return;

      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [getHasUnsavedChanges]);
}

export default useUnsavedChangesGuard;
