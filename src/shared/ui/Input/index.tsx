import styles from "./index.module.css";

import type { InputHTMLAttributes } from "react";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  heading?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const Input = ({ value, onChange, heading, ...props }: InputProps) => {
  return (
    <div className={styles["input-wrapper"]}>
      {heading && <h3>{heading}</h3>}
      <input
        type="text"
        value={value}
        className={styles["input-field"]}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
};

export default Input;
