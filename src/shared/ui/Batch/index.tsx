import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

import styles from "./index.module.css";

import type { ReactNode } from "react";

type BatchProps = {
  children: ReactNode;
  color?: "neutral" | "selected" | "primary" | "secondary" | "pale";
  variant?: "default" | "error";
  onClick?: (() => void) | null;
  onRetry?: (() => void) | null;
  onSelect?: (() => void) | null;
  isSelected?: boolean;
  ariaLabel?: string;
  isRetrying?: boolean;
};

const Batch = ({
  children,
  color = "neutral",
  variant = "default",
  onClick = null,
  onRetry = null,
  onSelect = null,
  isSelected = false,
  ariaLabel,
  isRetrying = false,
}: BatchProps) => {
  const resolvedColor =
    color === "primary" || color === "pale"
      ? "selected"
      : color === "secondary"
        ? "neutral"
        : color;

  if (onSelect) {
    return (
      <button
        type="button"
        className={styles["batch"]}
        data-color={isSelected ? "selected" : "neutral"}
        data-selectable="true"
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        onClick={onSelect}
      >
        {children}
      </button>
    );
  }

  if (onClick && !onRetry) {
    return (
      <button
        type="button"
        className={styles["batch"]}
        data-color={resolvedColor}
        data-variant={variant}
        data-clickable="true"
        data-retrying={isRetrying ? "true" : "false"}
        aria-busy={isRetrying || undefined}
        aria-label={ariaLabel ?? `Remove ${children} batch`}
        onClick={onClick}
        disabled={isRetrying}
      >
        {children}
        <CloseIcon className={styles["batch-close-icon"]} aria-hidden="true" />
      </button>
    );
  }

  return (
    <span
      className={styles["batch"]}
      data-color={resolvedColor}
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
          aria-label={ariaLabel ?? `Remove ${children} batch`}
        >
          <CloseIcon fontSize="inherit" />
        </button>
      )}
    </span>
  );
};

export default Batch;
