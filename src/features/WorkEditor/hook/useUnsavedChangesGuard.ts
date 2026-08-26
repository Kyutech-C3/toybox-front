import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";

import { buildWorkUpdatePayload } from "../api/toWorkPayload";
import { useWorkEditorStoreApi } from "../store/useWorkEditorStore";

import type { BlockerFunction } from "react-router-dom";

const LEAVE_CONFIRM_MESSAGE =
  "保存していない変更があります。このページを離れると、編集した内容は失われます。";

function useUnsavedChangesGuard(): void {
  const storeApi = useWorkEditorStoreApi();
  const getHasUnsavedChanges = useCallback(() => {
    const { initializedKey, current, baseline } = storeApi.getState();
    if (initializedKey === null) return false;

    return Object.keys(buildWorkUpdatePayload(current, baseline)).length > 0;
  }, [storeApi]);

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (currentLocation.pathname === nextLocation.pathname) return false;
      if (!getHasUnsavedChanges()) return false;

      return !window.confirm(LEAVE_CONFIRM_MESSAGE);
    },
    [getHasUnsavedChanges],
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
