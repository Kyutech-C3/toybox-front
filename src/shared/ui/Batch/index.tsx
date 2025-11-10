import CloseIcon from "@mui/icons-material/Close";

import styles from "./index.module.css";

import type { ReactNode } from "react";

type BatchProps = {
  children: ReactNode;
  color?: "primary" | "secondary";
  onClick?: (() => void) | null;
};

const Batch = ({ children, color = "primary", onClick = null }: BatchProps) => {
  return (
    <span
      className={styles["batch"]}
      data-color={color}
      data-onclick={onClick ? "true" : "false"}
    >
      {children}
      {onClick && (
        <button
          type="button"
          className={styles["batch-button"]}
          onClick={onClick}
          aria-label={`Remove ${children} batch`}
        >
          <CloseIcon fontSize="inherit" />
        </button>
      )}
    </span>
  );
};

export default Batch;
