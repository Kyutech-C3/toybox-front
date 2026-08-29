import { useContext } from "react";
import { useStore } from "zustand";

import WORK_EDITOR_STORE_CONTEXT from "./workEditorStoreContext";

import type {
  WorkEditorStore,
  WorkEditorStoreApi,
} from "./createWorkEditorStore";

type UseWorkEditorStoreApiReturn = WorkEditorStoreApi;

export const useWorkEditorStoreApi = (): UseWorkEditorStoreApiReturn => {
  const store = useContext(WORK_EDITOR_STORE_CONTEXT);

  if (!store) {
    throw new Error(
      "useWorkEditorStoreApi must be used within WorkEditorStoreProvider",
    );
  }

  return store;
};

export function useWorkEditorStore<T>(
  selector: (state: WorkEditorStore) => T,
): T {
  return useStore(useWorkEditorStoreApi(), selector);
}

export { selectIsDirty, selectIsUploading } from "./createWorkEditorStore";
