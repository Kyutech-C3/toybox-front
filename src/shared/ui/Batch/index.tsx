import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

import styles from "./index.module.css";

import type { ReactNode } from "react";

type BatchProps = {
  children: ReactNode;
  color?: "primary" | "secondary";
  variant?: "default" | "error";
  onClick?: (() => void) | null;
  onRetry?: (() => void) | null;
  isRetrying?: boolean;
};

const Batch = ({
  children,
  color = "primary",
  variant = "default",
  onClick = null,
  onRetry = null,
  isRetrying = false,
}: BatchProps) => {
  return (
    <span
      className={styles["batch"]}
      data-color={color}
      data-variant={variant}
      data-clickable={onClick ? "true" : "false"}
      data-retrying={isRetrying ? "true" : "false"}
      aria-busy={isRetrying || undefined}
    >
      {children}
      {onRetry && (
        <button
          type="button"
          className={styles["batch-button"]}
          onClick={onRetry}
          disabled={isRetrying}
          aria-label={
            isRetrying
              ? `Retrying ${children} batch`
              : `Retry ${children} batch`
          }
        >
          <RefreshIcon
            className={styles["batch-retry-icon"]}
            data-spinning={isRetrying ? "true" : "false"}
            fontSize="inherit"
          />
        </button>
      )}
      {onClick && (
        <button
          type="button"
          className={styles["batch-button"]}
          onClick={onClick}
          disabled={isRetrying}
          aria-label={`Remove ${children} batch`}
        >
          <CloseIcon fontSize="inherit" />
        </button>
      )}
    </span>
  );
};

export default Batch;
