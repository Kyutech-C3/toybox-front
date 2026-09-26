import styles from "./index.module.css";

import type { ReactNode } from "react";

type CharacterCountProps = {
  value: string;
  maxLength?: number;
  id?: string;
  children?: ReactNode;
  placement?: "outside" | "inline";
};

const CharacterCount = ({
  value,
  maxLength,
  id,
  children,
  placement = "outside",
}: CharacterCountProps) => {
  const count = Array.from(value).length;
  const label = `${count}${maxLength !== undefined ? `/${maxLength}` : ""}`;
  const counter = (
    <span
      id={id}
      data-placement={placement}
      className={styles["character-count"]}
      data-over-limit={maxLength !== undefined && count > maxLength}
    >
      {label}
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
