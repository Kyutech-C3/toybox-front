import styles from "./index.module.css";

import type { ComponentPropsWithRef, ReactNode } from "react";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "destructive"
    | "ghost"
    | "link";
  size?: "default" | "small" | "compact";
  icon?: ReactNode;
  isIconOnly?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isActive?: boolean;
  ariaLabel?: string;
};

const Button = ({
  children,
  variant = "primary",
  size = "default",
  icon,
  isIconOnly = false,
  isLoading = false,
  isDisabled = false,
  isActive = false,
  ariaLabel,
  disabled = false,
  type = "button",
  className,
  ...buttonProps
}: ButtonProps) => {
  const isUnavailable = disabled || isDisabled || isLoading;

  return (
    <button
      {...buttonProps}
      type={type}
      className={[styles["button"], className].filter(Boolean).join(" ")}
      disabled={isUnavailable}
      aria-label={buttonProps["aria-label"] ?? ariaLabel}
      aria-busy={isLoading || buttonProps["aria-busy"]}
      data-variant={variant}
      data-size={size}
      data-icon-only={isIconOnly ? "true" : "false"}
      data-disabled={isUnavailable ? "true" : "false"}
      data-active={isActive ? "true" : "false"}
    >
      {icon && (
        <span className={styles["icon"]} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
