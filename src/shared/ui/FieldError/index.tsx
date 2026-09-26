import styles from "./index.module.css";

import type { ComponentPropsWithoutRef } from "react";

type FieldErrorProps = ComponentPropsWithoutRef<"p">;

const FieldError = ({ children, className, ...props }: FieldErrorProps) => {
  if (!children) return null;
  return (
    <p
      {...props}
      className={[styles["field-error"], className].filter(Boolean).join(" ")}
    >
      {children}
    </p>
  );
};

export default FieldError;
