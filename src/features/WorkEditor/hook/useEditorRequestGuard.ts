import { useEffect, useRef } from "react";

import { useWorkEditorStoreApi } from "../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

type UseEditorRequestGuardReturn = { createRequestGuard: () => () => boolean };

const useEditorRequestGuard = (): UseEditorRequestGuardReturn => {
  const store = useWorkEditorStoreApi();
  const generationRef = useRef(0);
  useEffect(
    () => () => {
      generationRef.current += 1;
    },
    [],
  );
  const createRequestGuard = () => {
    const generation = generationRef.current;
    const editorSession = store.getState().sessionVersion;
    const authSession = useAuthStore.getState().sessionVersion;
    return () =>
      generation === generationRef.current &&
      editorSession === store.getState().sessionVersion &&
      authSession === useAuthStore.getState().sessionVersion;
  };
  return { createRequestGuard };
};

export default useEditorRequestGuard;
