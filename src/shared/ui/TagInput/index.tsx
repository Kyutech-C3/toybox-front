import { useId, useState } from "react";

import Batch from "../Batch";
import TagSelector from "../TagSelector";
import styles from "./index.module.css";

import { formatTagLabel, normalizeTagNameInput } from "@/util/tagName";

import type { FormEvent, InputHTMLAttributes } from "react";
import type { TagSelectorOption } from "../TagSelector";

export type TagInputTag = {
  id: string;
  name: string;
};

type TagInputProps = {
  tags: TagInputTag[];
  allTagOptions: TagSelectorOption[];
  failedTags?: string[];
  retryingTags?: string[];
  errorMessage?: string;
  onAddTag: (tagID: string) => void;
  onCreateTag: (tagName: string) => void;
  onRemoveTag: (tagID: string) => void;
  onRetryTag?: (tagName: string) => void;
  onRemoveFailedTag?: (tagName: string) => void;
  heading?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const TagInput = ({
  tags,
  allTagOptions,
  failedTags = [],
  retryingTags = [],
  errorMessage,
  onAddTag,
  onCreateTag,
  onRemoveTag,
  onRetryTag,
  onRemoveFailedTag,
  heading,
  ...props
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isNameEmpty, setNameEmpty] = useState(false);
  const createInputID = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tagName = normalizeTagNameInput(inputValue);
    if (tagName === "") {
      setNameEmpty(true);
      return;
    }

    onCreateTag(tagName);
    setInputValue("");
    setNameEmpty(false);
  };

  return (
    <section className={styles["tag-input-wrapper"]}>
      {heading && <h3>{heading}</h3>}
      <TagSelector
        allTags={allTagOptions}
        selectedTags={tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onClearTags={() => {
          tags.forEach((tag) => {
            onRemoveTag(tag.id);
          });
        }}
        ariaLabel="作品に付けるタグを探す"
        searchPlaceholder="既存のタグを探す"
      />
      <form className={styles["create-form"]} onSubmit={handleSubmit}>
        <label htmlFor={createInputID}>新しいタグを作成</label>
        <div className={styles["create-row"]}>
          <input
            id={createInputID}
            type="text"
            name="tag"
            placeholder="#タグ名"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setNameEmpty(false);
            }}
            {...props}
          />
          <button type="submit">作成</button>
        </div>
        {isNameEmpty && <p role="alert">タグ名を入力してください。</p>}
      </form>
      {failedTags.length > 0 && (
        <div className={styles["failed-tags"]}>
          {failedTags.map((name) => {
            const isRetrying = retryingTags.some(
              (retrying) => retrying.toLowerCase() === name.toLowerCase(),
            );
            return (
              <Batch
                key={name}
                variant="error"
                isRetrying={isRetrying}
                onRetry={onRetryTag ? () => onRetryTag(name) : null}
                onClick={
                  onRemoveFailedTag ? () => onRemoveFailedTag(name) : null
                }
                ariaLabel={`${formatTagLabel(name)}の作成失敗を取り消す`}
              >
                {formatTagLabel(name)}
              </Batch>
            );
          })}
        </div>
      )}
      {errorMessage && (
        <p className={styles["tag-error"]} role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  );
};

export default TagInput;
