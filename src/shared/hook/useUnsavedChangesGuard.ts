import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";

import type { BlockerFunction } from "react-router-dom";

type UseUnsavedChangesGuardParams = {
  getHasUnsavedChanges: () => boolean;
  onDiscard?: () => void;
};

type UseUnsavedChangesGuardReturn = undefined;

const LEAVE_CONFIRM_MESSAGE =
  "保存していない変更があります。このページを離れると、編集した内容は失われます。";

const useUnsavedChangesGuard = ({
  getHasUnsavedChanges,
  onDiscard,
}: UseUnsavedChangesGuardParams): UseUnsavedChangesGuardReturn => {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (
        currentLocation.pathname === nextLocation.pathname ||
        !getHasUnsavedChanges()
      )
        return false;
      if (!window.confirm(LEAVE_CONFIRM_MESSAGE)) return true;
      onDiscard?.();
      return false;
    },
    [getHasUnsavedChanges, onDiscard],
  );
  const blocker = useBlocker(shouldBlock);
  useEffect(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (getHasUnsavedChanges()) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [getHasUnsavedChanges]);
};

export default useUnsavedChangesGuard;
