import { useId, useMemo, useRef, useState } from "react";

import Batch from "../Batch";
import Listbox from "../Listbox";
import styles from "./index.module.css";

import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import type { ListboxOption } from "../Listbox";

export type TagInputTag = {
  id: string;
  name: string;
};

type TagInputProps = {
  tags: TagInputTag[];
  allTagOptions?: string[];
  failedTags?: string[];
  retryingTags?: string[];
  errorMessage?: string;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tagID: string) => void;
  onRetryTag?: (tag: string) => void;
  onRemoveFailedTag?: (tag: string) => void;
  heading?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const renderTagOptionLabel = (name: string, keyword: string): ReactNode => {
  const matchIndex = name.toLowerCase().indexOf(keyword.toLowerCase());
  if (keyword === "" || matchIndex < 0) return name;

  return (
    <span className={styles["tag-option-label"]}>
      {name.slice(0, matchIndex)}
      <span className={styles["tag-option-match"]}>
        {name.slice(matchIndex, matchIndex + keyword.length)}
      </span>
      {name.slice(matchIndex + keyword.length)}
    </span>
  );
};

const TagInput = ({
  tags,
  allTagOptions,
  failedTags = [],
  retryingTags = [],
  errorMessage,
  onAddTag,
  onRemoveTag,
  onRetryTag,
  onRemoveFailedTag,
  heading,
  ...props
}: TagInputProps) => {
  const [isFocused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tagListboxID = useId();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tag = inputValue.trim();
    if (tag !== "") {
      if (tags.some(({ name }) => name.toLowerCase() === tag.toLowerCase())) {
        return;
      }
      onAddTag(tag);
      setInputValue("");
    }
  };

  const tagOptions = useMemo<ListboxOption<string>[]>(() => {
    if (!allTagOptions) return [];
    const keyword = inputValue.trim();
    const lowerKeyword = keyword.toLowerCase();

    return allTagOptions
      .filter(
        (option) =>
          option.toLowerCase().includes(lowerKeyword) &&
          !tags.some(({ name }) => name.toLowerCase() === option.toLowerCase()),
      )
      .sort(
        (left, right) =>
          left.toLowerCase().indexOf(lowerKeyword) -
          right.toLowerCase().indexOf(lowerKeyword),
      )
      .map((option) => ({
        id: option,
        value: option,
        label: renderTagOptionLabel(option, keyword),
      }));
  }, [inputValue, allTagOptions, tags]);

  return (
    <form className={styles["tag-input-wrapper"]} onSubmit={handleSubmit}>
      {heading && <h3>{heading}</h3>}
      <div className={styles["input-wrapper"]}>
        <div className={styles["tags-wrapper"]}>
          {tags.map((tag) => (
            <Batch
              key={tag.id}
              color="primary"
              onClick={() => {
                onRemoveTag(tag.id);
              }}
            >
              {tag.name}
            </Batch>
          ))}
          {failedTags.map((name) => {
            const isRetrying = retryingTags.some(
              (retrying) => retrying.toLowerCase() === name.toLowerCase(),
            );
            return (
              <Batch
                key={`failed-${name}`}
                variant="error"
                isRetrying={isRetrying}
                onRetry={onRetryTag ? () => onRetryTag(name) : null}
                onClick={
                  onRemoveFailedTag ? () => onRemoveFailedTag(name) : null
                }
              >
                {name}
              </Batch>
            );
          })}
          <Listbox
            id={tagListboxID}
            isOpen={tagOptions.length > 0 && isFocused}
            options={tagOptions}
            placement="bottom"
            align="start"
            ariaLabel="タグ候補"
            className={styles["tag-listbox"]}
            onClose={() => setFocused(false)}
            triggerRef={inputRef}
            onSelect={(tag) => {
              if (
                tags.some(
                  ({ name }) => name.toLowerCase() === tag.toLowerCase(),
                )
              ) {
                return;
              }
              onAddTag(tag);
              setInputValue("");
              setFocused(false);
            }}
          />
          <input
            type="text"
            role="combobox"
            name="tag"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setFocused(true);
            }}
            className={styles["input-field"]}
            {...props}
            aria-haspopup="listbox"
            aria-expanded={tagOptions.length > 0 && isFocused}
            aria-controls={tagListboxID}
            aria-autocomplete="list"
            ref={inputRef}
          />
        </div>
      </div>
      {errorMessage && (
        <p className={styles["tag-error"]} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
};

export default TagInput;
