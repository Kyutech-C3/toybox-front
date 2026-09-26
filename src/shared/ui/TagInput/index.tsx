import Batch from "../Batch";
import TagSelector from "../TagSelector";
import styles from "./index.module.css";

import FieldError from "@/shared/ui/FieldError";
import { normalizeTagNameInput } from "@/util/tagName";

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
  onCreateTag: (tagName: string) => Promise<boolean>;
  onRemoveTag: (tagID: string) => void;
  onRetryTag?: (tagName: string) => void;
  onRemoveFailedTag?: (tagName: string) => void;
  heading?: string;
};

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
}: TagInputProps) => {
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
        layout="editor"
        onCreateTag={onCreateTag}
      />
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
                ariaLabel={`${normalizeTagNameInput(name)}の作成失敗を取り消す`}
              >
                {normalizeTagNameInput(name)}
              </Batch>
            );
          })}
        </div>
      )}
      {errorMessage && <FieldError role="alert">{errorMessage}</FieldError>}
    </section>
  );
};

export default TagInput;
