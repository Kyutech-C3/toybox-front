import { useRef } from "react";

import { createWorkEditorStore } from "../createWorkEditorStore";
import WORK_EDITOR_STORE_CONTEXT from "../workEditorStoreContext";

import type { ReactNode } from "react";
import type { WorkEditorStoreApi } from "../createWorkEditorStore";

type WorkEditorStoreProviderProps = {
  children: ReactNode;
};

const WorkEditorStoreProvider = ({
  children,
}: WorkEditorStoreProviderProps) => {
  const storeRef = useRef<WorkEditorStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createWorkEditorStore();
  }

  return (
    <WORK_EDITOR_STORE_CONTEXT.Provider value={storeRef.current}>
      {children}
    </WORK_EDITOR_STORE_CONTEXT.Provider>
  );
};

export default WorkEditorStoreProvider;
