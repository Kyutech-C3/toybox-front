import { useRef } from "react";

import type { ChangeEvent, CompositionEvent } from "react";

type UseCharacterLimitParams = {
  maxLength?: number;
  onChange: (value: string) => void;
};

type TextControl = HTMLInputElement | HTMLTextAreaElement;

type UseCharacterLimitReturn = {
  onChange: (event: ChangeEvent<TextControl>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: CompositionEvent<TextControl>) => void;
};

export const truncateText = (value: string, maxLength?: number): string =>
  maxLength === undefined
    ? value
    : Array.from(value).slice(0, maxLength).join("");

const useCharacterLimit = ({
  maxLength,
  onChange,
}: UseCharacterLimitParams): UseCharacterLimitReturn => {
  const isComposingRef = useRef(false);
  return {
    onChange: (event) =>
      onChange(
        isComposingRef.current
          ? event.target.value
          : truncateText(event.target.value, maxLength),
      ),
    onCompositionStart: () => {
      isComposingRef.current = true;
    },
    onCompositionEnd: (event) => {
      isComposingRef.current = false;
      onChange(truncateText(event.currentTarget.value, maxLength));
    },
  };
};

export default useCharacterLimit;
