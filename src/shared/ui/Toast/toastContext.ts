import { createContext } from "react";

import type { UseToastReturn } from "./types";

const TOAST_CONTEXT = createContext<UseToastReturn | null>(null);

export default TOAST_CONTEXT;
