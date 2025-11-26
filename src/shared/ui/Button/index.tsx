import styles from "./index.module.css";

import type React from "react";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  children,
  type = "button",
  className,
}) => {
  return (
    <button
      className={`${styles.button} ${className || ""}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
