import { useEffect, useId, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import UrlFavicon from "../UrlFavicon";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import FieldError from "@/shared/ui/FieldError";
import Input from "@/shared/ui/Input";

import type { KeyboardEvent } from "react";

type UrlInputFieldProps = {
  index: number;
  value: string;
  committedUrl: string | null;
  error: string;
  isFocusRequested: boolean;
  isRemovable: boolean;
  hasReachedUrlLimit: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  onAddAfter: (value: string) => void;
  onRemove: () => void;
  onRemoveEmpty: (direction: "backward" | "forward") => void;
  onFocusApplied: () => void;
};

const UrlInputField = ({
  index,
  value,
  committedUrl,
  error,
  isFocusRequested,
  isRemovable,
  hasReachedUrlLimit,
  onChange,
  onCommit,
  onAddAfter,
  onRemove,
  onRemoveEmpty,
  onFocusApplied,
}: UrlInputFieldProps) => {
  const errorID = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocusRequested) return;

    inputRef.current?.focus();
    onFocusApplied();
  }, [isFocusRequested, onFocusApplied]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (value.trim() === "" || hasReachedUrlLimit) {
        event.currentTarget.blur();
        return;
      }
      onAddAfter(event.currentTarget.value);
      return;
    }

    if (value !== "" || !isRemovable) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      onRemoveEmpty("backward");
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      onRemoveEmpty("forward");
    }
  };

  return (
    <div className={styles["url-field"]}>
      <Input
        isCharacterCountVisible
        leadingContent={
          <span className={styles["favicon-slot"]}>
            {committedUrl !== null && (
              <UrlFavicon key={committedUrl} url={committedUrl} />
            )}
          </span>
        }
        trailingContent={
          <Button
            variant="ghost"
            size="small"
            isIconOnly
            icon={<CloseRoundedIcon />}
            onClick={onRemove}
            aria-label={`リンク ${index + 1}を削除`}
          />
        }
        type="url"
        inputMode="url"
        name="url"
        value={value}
        placeholder="https://example.com/"
        aria-label={`リンク ${index + 1}`}
        aria-invalid={error !== ""}
        aria-describedby={error !== "" ? errorID : undefined}
        ref={inputRef}
        onChange={onChange}
        onBlur={(event) => onCommit(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      {error !== "" && (
        <FieldError id={errorID} role="alert">
          {error}
        </FieldError>
      )}
    </div>
  );
};

export default UrlInputField;
