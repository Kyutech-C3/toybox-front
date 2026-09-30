type ToastSeverity = "success" | "info" | "warning" | "error";

type ShowToastParams = {
  message: string;
  severity: ToastSeverity;
};

type UseToastReturn = {
  showToast: (params: ShowToastParams) => void;
};

export type { ShowToastParams, ToastSeverity, UseToastReturn };
