import styles from "./index.module.css";

import type { ReactNode } from "react";

type CharacterCountProps = {
  value: string;
  maxLength?: number;
  id?: string;
  children?: ReactNode;
};

const CharacterCount = ({
  value,
  maxLength,
  id,
  children,
}: CharacterCountProps) => {
  const count = Array.from(value).length;
  const counter = (
    <span
      id={id}
      className={styles["character-count"]}
      data-over-limit={maxLength !== undefined && count > maxLength}
    >
      {count}
      {maxLength !== undefined && `/${maxLength}`}
    </span>
  );
  if (children === undefined) return counter;
  return (
    <div className={styles["counted-field"]}>
      {children}
      {counter}
    </div>
  );
};

export default CharacterCount;
