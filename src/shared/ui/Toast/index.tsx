import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import type { ToastSeverity } from "./types";

type ToastProps = {
  isOpen: boolean;
  message: string;
  severity: ToastSeverity;
  onClose: () => void;
  autoHideDuration?: number | null;
};

const Toast = ({
  isOpen,
  message,
  severity,
  onClose,
  autoHideDuration = 3000,
}: ToastProps) => {
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={onClose}
    >
      <Alert severity={severity} variant="filled" onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
