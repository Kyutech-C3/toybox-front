import { useContext } from "react";

import TOAST_CONTEXT from "../toastContext";

import type { UseToastReturn } from "../types";

const useToast = (): UseToastReturn => {
  const context = useContext(TOAST_CONTEXT);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};

export default useToast;
