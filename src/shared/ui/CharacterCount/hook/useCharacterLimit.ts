import { useRef } from "react";

import { getTextLength } from "@/util/getTextLength";

import type { ChangeEvent, CompositionEvent } from "react";

type UseCharacterLimitParams = {
  maxLength?: number;
  newlineLength?: 1 | 2;
  onChange: (value: string) => void;
};

type TextControl = HTMLInputElement | HTMLTextAreaElement;

type UseCharacterLimitReturn = {
  onChange: (event: ChangeEvent<TextControl>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: CompositionEvent<TextControl>) => void;
};

export const truncateText = (
  value: string,
  maxLength?: number,
  newlineLength: 1 | 2 = 1,
): string => {
  if (maxLength === undefined) return value;
  if (newlineLength === 1)
    return Array.from(value).slice(0, maxLength).join("");
  let result = "";
  let length = 0;
  for (const character of value.match(/\r\n|[\s\S]/gu) ?? []) {
    length += getTextLength(character, newlineLength);
    if (length > maxLength) break;
    result += character;
  }
  return result;
};

const useCharacterLimit = ({
  maxLength,
  newlineLength = 1,
  onChange,
}: UseCharacterLimitParams): UseCharacterLimitReturn => {
  const isComposingRef = useRef(false);
  return {
    onChange: (event) =>
      onChange(
        isComposingRef.current
          ? event.target.value
          : truncateText(event.target.value, maxLength, newlineLength),
      ),
    onCompositionStart: () => {
      isComposingRef.current = true;
    },
    onCompositionEnd: (event) => {
      isComposingRef.current = false;
      onChange(
        truncateText(event.currentTarget.value, maxLength, newlineLength),
      );
    },
  };
};

export default useCharacterLimit;
