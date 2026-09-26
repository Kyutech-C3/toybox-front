import CharacterCount from "../CharacterCount";
import useCharacterLimit from "../CharacterCount/hook/useCharacterLimit";
import styles from "./index.module.css";

import type { ComponentPropsWithRef, ReactNode } from "react";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  heading?: string;
  isCharacterCountVisible?: boolean;
  characterCountID?: string;
  variant?: "default" | "plain";
  containerClassName?: string;
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
} & Omit<ComponentPropsWithRef<"input">, "value" | "onChange">;

const Input = ({
  value,
  onChange,
  heading,
  maxLength,
  isCharacterCountVisible = false,
  characterCountID,
  variant = "default",
  className,
  containerClassName,
  leadingContent,
  trailingContent,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: InputProps) => {
  const limitHandlers = useCharacterLimit({ maxLength, onChange });
  const hasAdornments =
    containerClassName !== undefined ||
    leadingContent !== undefined ||
    trailingContent !== undefined;
  const accessibleName = props["aria-label"] ?? heading;
  const input = (
    <input
      type="text"
      value={value}
      aria-label={accessibleName}
      className={[
        variant === "default"
          ? hasAdornments
            ? styles["input-inner"]
            : `${styles["input-surface"]} ${styles["input-field"]}`
          : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...limitHandlers}
      {...props}
      onCompositionStart={(event) => {
        limitHandlers.onCompositionStart();
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        limitHandlers.onCompositionEnd(event);
        onCompositionEnd?.(event);
      }}
    />
  );
  const control = hasAdornments ? (
    <div
      className={[
        variant === "default"
          ? `${styles["input-surface"]} ${styles["input-adorned"]}`
          : undefined,
        containerClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      data-character-count-control
      data-invalid={
        props["aria-invalid"] === true || props["aria-invalid"] === "true"
          ? "true"
          : "false"
      }
    >
      {leadingContent}
      {input}
      {trailingContent}
    </div>
  ) : (
    input
  );
  const field = isCharacterCountVisible ? (
    <CharacterCount value={value} maxLength={maxLength} id={characterCountID}>
      {control}
    </CharacterCount>
  ) : (
    control
  );
  if (variant === "plain" && !heading) return field;
  return (
    <div className={styles["input-wrapper"]}>
      {heading && <h3>{heading}</h3>}
      {field}
    </div>
  );
};

export default Input;
