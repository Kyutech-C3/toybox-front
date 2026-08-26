import { useEffect } from "react";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import useWorkForEdit from "./useWorkForEdit";

import { useUserStore } from "@/features/auth/store/useUserStore";

export type WorkEditorSetupStatus = "loading" | "ready" | "forbidden" | "error";

type UseWorkEditorSetupParams = {
  workID: string | null;
};

type UseWorkEditorSetupReturn = {
  status: WorkEditorSetupStatus;
};

const useWorkEditorSetup = ({
  workID,
}: UseWorkEditorSetupParams): UseWorkEditorSetupReturn => {
  const currentUser = useUserStore((state) => state.user);
  const hasUserLoadFailed = useUserStore((state) => state.hasLoadFailed);
  const initializedKey = useWorkEditorStore((state) => state.initializedKey);
  const initializeForNew = useWorkEditorStore(
    (state) => state.initializeForNew,
  );
  const initializeForEdit = useWorkEditorStore(
    (state) => state.initializeForEdit,
  );
  const resetEditor = useWorkEditorStore((state) => state.resetEditor);

  const { data } = useWorkForEdit({ workID });
  const isOwner = Boolean(currentUser && data?.user.id === currentUser.id);

  useEffect(() => {
    if (workID === null) {
      initializeForNew();
      return;
    }
    if (!data || !isOwner) return;
    initializeForEdit(data);
  }, [workID, data, isOwner, initializeForNew, initializeForEdit]);

  useEffect(() => resetEditor, [resetEditor]);

  if (workID === null) {
    return { status: initializedKey === "new" ? "ready" : "loading" };
  }
  if (!currentUser) {
    return { status: hasUserLoadFailed ? "error" : "loading" };
  }
  if (!data) return { status: "loading" };
  if (!isOwner) return { status: "forbidden" };
  return { status: initializedKey === workID ? "ready" : "loading" };
};

export default useWorkEditorSetup;
