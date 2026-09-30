import { useCallback, useMemo, useState } from "react";

import Toast from "../index";
import TOAST_CONTEXT from "../toastContext";

import type { ReactNode } from "react";
import type { ShowToastParams } from "../types";

type ToastProviderProps = {
  children: ReactNode;
};

type ToastState = ShowToastParams & {
  id: number;
};

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showToast = useCallback((params: ShowToastParams) => {
    setToast((currentToast) => ({
      ...params,
      id: (currentToast?.id ?? 0) + 1,
    }));
    setIsOpen(true);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <TOAST_CONTEXT.Provider value={contextValue}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          isOpen={isOpen}
          message={toast.message}
          severity={toast.severity}
          onClose={() => setIsOpen(false)}
        />
      )}
    </TOAST_CONTEXT.Provider>
  );
};

export default ToastProvider;
