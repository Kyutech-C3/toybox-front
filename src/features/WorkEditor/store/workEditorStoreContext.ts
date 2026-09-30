import { createContext } from "react";

import type { WorkEditorStoreApi } from "./createWorkEditorStore";

const WORK_EDITOR_STORE_CONTEXT = createContext<WorkEditorStoreApi | null>(
  null,
);

export default WORK_EDITOR_STORE_CONTEXT;
