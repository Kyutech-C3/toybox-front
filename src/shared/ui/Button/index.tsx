import styles from "./index.module.css";

import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  isActive?: boolean;
  ariaLabel?: string;
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  isActive = false,
  ariaLabel,
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={styles[`${variant}-button`]}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-disabled={disabled ? "true" : "false"}
      data-active={isActive ? "true" : "false"}
    >
      {children}
    </button>
  );
};

export default Button;
