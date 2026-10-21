import styles from "./index.module.css";

import { getTextLength } from "@/util/getTextLength";

import type { ReactNode } from "react";

type CharacterCountProps = {
  value: string;
  maxLength?: number;
  newlineLength?: 1 | 2;
  id?: string;
  children?: ReactNode;
  placement?: "outside" | "inline";
};

const CharacterCount = ({
  value,
  maxLength,
  newlineLength = 1,
  id,
  children,
  placement = "outside",
}: CharacterCountProps) => {
  const count = getTextLength(value, newlineLength);
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
