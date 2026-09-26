import CharacterCount from "../CharacterCount";
import useCharacterLimit from "../CharacterCount/hook/useCharacterLimit";
import inputStyles from "../Input/index.module.css";
import styles from "./index.module.css";

import type { ComponentPropsWithRef } from "react";

type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  isCharacterCountVisible?: boolean;
  characterCountID?: string;
  variant?: "default" | "plain";
  containerClassName?: string;
  isAutoResizing?: boolean;
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
  isAutoResizing = false,
  ref,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: TextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const setTextareaRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === "function") return ref(element);
      if (ref) ref.current = element;
    },
    [ref],
  );
  const adjustHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!isAutoResizing || !element) return;
    element.style.height = "auto";
    const style = getComputedStyle(element);
    const correction =
      style.boxSizing === "border-box"
        ? Number.parseFloat(style.borderTopWidth) +
          Number.parseFloat(style.borderBottomWidth)
        : -Number.parseFloat(style.paddingTop) -
          Number.parseFloat(style.paddingBottom);
    element.style.height = `${element.scrollHeight + correction}px`;
  }, [isAutoResizing]);
  useLayoutEffect(() => {
    // Measure the committed value, including values cleared after saving.
    if (textareaRef.current?.value === value) adjustHeight();
  }, [value, adjustHeight]);
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!isAutoResizing || !element) return;
    let previousWidth = 0;
    let frameID = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      cancelAnimationFrame(frameID);
      frameID = requestAnimationFrame(adjustHeight);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameID);
    };
  }, [isAutoResizing, adjustHeight]);
  const limitHandlers = useCharacterLimit({ maxLength, onChange });
  const input = (
    <textarea
      ref={setTextareaRef}
      data-auto-resizing={isAutoResizing ? "true" : undefined}
      value={value}
      className={[
        variant === "default"
          ? `${inputStyles["input-surface"]} ${styles["textarea-field"]}`
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

import { useCallback, useLayoutEffect, useRef } from "react";
