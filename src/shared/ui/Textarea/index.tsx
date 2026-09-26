import CharacterCount from "../CharacterCount";
import useCharacterLimit from "../CharacterCount/hook/useCharacterLimit";
import styles from "./index.module.css";

import type { ComponentPropsWithRef } from "react";

type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  isCharacterCountVisible?: boolean;
  characterCountID?: string;
  variant?: "default" | "plain";
  containerClassName?: string;
} & Omit<ComponentPropsWithRef<"textarea">, "value" | "onChange">;

const Textarea = ({
  value,
  onChange,
  maxLength,
  isCharacterCountVisible = false,
  characterCountID,
  variant = "default",
  className,
  containerClassName,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: TextareaProps) => {
  const limitHandlers = useCharacterLimit({ maxLength, onChange });
  const input = (
    <textarea
      value={value}
      className={[
        variant === "default" ? styles["textarea-field"] : undefined,
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
  const control = containerClassName ? (
    <div className={containerClassName} data-character-count-control>
      {input}
    </div>
  ) : (
    input
  );
  return isCharacterCountVisible ? (
    <CharacterCount value={value} maxLength={maxLength} id={characterCountID}>
      {control}
    </CharacterCount>
  ) : (
    control
  );
};

export default Textarea;
