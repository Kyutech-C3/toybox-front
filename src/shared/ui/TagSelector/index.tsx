import { useMemo, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";

import CollapsibleTagList from "./CollapsibleTagList";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import { normalizeTagNameInput } from "@/util/tagName";

import type { FormEvent } from "react";
import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";

export type TagSelectorOption = {
  id: string;
  name: string;
  work_count: number;
};

type TagSelectorProps = {
  allTags: TagSelectorOption[];
  selectedTags: { id: string; name: string }[];
  onAddTag: (tagID: string) => void;
  onRemoveTag: (tagID: string) => void;
  onClearTags: () => void;
  ariaLabel?: string;
  searchPlaceholder?: string;
  onCreateTag?: (tagName: string) => Promise<boolean>;
};

type TagSortOrder = "popular" | "name";

const TAG_SORT_OPTIONS: SegmentedControlOption<TagSortOrder>[] = [
  { value: "popular", label: "多い順" },
  { value: "name", label: "名前順" },
];

const compareTagName = (left: TagSelectorOption, right: TagSelectorOption) =>
  normalizeTagNameInput(left.name).localeCompare(
    normalizeTagNameInput(right.name),
    "ja",
  );

const TagSelector = ({
  allTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onClearTags,
  ariaLabel = "タグで作品を探す",
  searchPlaceholder = "タグで作品を探す",
  onCreateTag,
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortOrder, setSortOrder] = useState<TagSortOrder>("popular");
  const [isCreating, setCreating] = useState(false);
  const selectedIDs = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags],
  );
  const sortedTags = useMemo(
    () =>
      [...allTags].sort((left, right) =>
        sortOrder === "popular"
          ? right.work_count - left.work_count || compareTagName(left, right)
          : compareTagName(left, right),
      ),
    [allTags, sortOrder],
  );
  const normalizedKeyword = normalizeTagNameInput(keyword).toLocaleLowerCase();
  const tagName = normalizeTagNameInput(keyword);
  const canCreateTag =
    tagName !== "" &&
    !allTags.some(
      (tag) =>
        normalizeTagNameInput(tag.name).toLocaleLowerCase() ===
        normalizedKeyword,
    );
  const matchingTags = useMemo(
    () =>
      normalizedKeyword === ""
        ? sortedTags
        : sortedTags.filter((tag) =>
            normalizeTagNameInput(tag.name)
              .toLocaleLowerCase()
              .includes(normalizedKeyword),
          ),
    [normalizedKeyword, sortedTags],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalizedKeyword === "") return;
    const exactMatch = matchingTags.find(
      (tag) =>
        normalizeTagNameInput(tag.name).toLocaleLowerCase() ===
        normalizedKeyword,
    );
    const tagToAdd =
      exactMatch ?? matchingTags.find((tag) => !selectedIDs.has(tag.id));
    if (tagToAdd && !selectedIDs.has(tagToAdd.id)) onAddTag(tagToAdd.id);
  };
  const handleCreateTag = async () => {
    if (!onCreateTag || !canCreateTag || isCreating) return;
    if (!window.confirm(`「${tagName}」を新しいタグとして作成しますか？`))
      return;
    setCreating(true);
    try {
      if (await onCreateTag(tagName)) setKeyword("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className={styles["tag-search"]} aria-label={ariaLabel}>
      <div className={styles["tag-toolbar"]}>
        <SegmentedControl
          options={TAG_SORT_OPTIONS}
          value={sortOrder}
          onChange={setSortOrder}
          ariaLabel="タグの並び順"
        />
        <form className={styles["search-form"]} onSubmit={handleSubmit}>
          <Input
            type="search"
            ref={searchInputRef}
            className={styles["search-field"]}
            containerClassName={styles["search-surface"]}
            trailingContent={
              <Button
                variant="ghost"
                size="compact"
                isIconOnly
                icon={<CloseRoundedIcon />}
                disabled={keyword === "" || isCreating}
                aria-label="タグの入力をクリア"
                onClick={() => {
                  setKeyword("");
                  searchInputRef.current?.focus();
                }}
              />
            }
            aria-label={ariaLabel}
            placeholder={searchPlaceholder}
            value={keyword}
            readOnly={isCreating}
            maxLength={onCreateTag ? 50 : undefined}
            isCharacterCountVisible={!!onCreateTag}
            data-character-count-control={onCreateTag ? true : undefined}
            onChange={setKeyword}
          />
          {onCreateTag && (
            <Button
              variant="accent"
              size="small"
              className={styles["create-button"]}
              isLoading={isCreating}
              disabled={!canCreateTag || isCreating}
              aria-label={isCreating ? "タグを作成中" : "タグを新規作成"}
              onClick={() => void handleCreateTag()}
            >
              <span className={styles["create-label"]}>
                {isCreating ? "作成中…" : "新規作成"}
              </span>
              <span className={styles["create-symbol"]} aria-hidden="true">
                <AddRoundedIcon fontSize="inherit" />
              </span>
            </Button>
          )}
        </form>
        <Button
          variant="destructive"
          size="small"
          className={styles["clear-button"]}
          disabled={selectedTags.length === 0}
          aria-label={
            selectedTags.length > 0
              ? `選択中の${selectedTags.length}件のタグをクリア`
              : "選択中のタグはありません"
          }
          icon={<FilterAltOffRoundedIcon />}
          onClick={onClearTags}
        >
          <span className={styles["clear-label"]}>クリア</span>
          {selectedTags.length > 0 && (
            <span className={styles["selected-count"]}>
              {selectedTags.length}
            </span>
          )}
        </Button>
      </div>

      {allTags.length > 0 || selectedTags.length > 0 ? (
        <CollapsibleTagList
          isHeightKept={normalizedKeyword !== ""}
          leadingItems={selectedTags.map((tag) => (
            <Batch
              key={tag.id}
              color="selected"
              ariaLabel={`${normalizeTagNameInput(tag.name)}の選択を解除`}
              onClick={() => onRemoveTag(tag.id)}
            >
              {normalizeTagNameInput(tag.name)}
            </Batch>
          ))}
        >
          {matchingTags.length > 0 ? (
            matchingTags.map((tag) => (
              <Batch
                key={tag.id}
                onSelect={() =>
                  selectedIDs.has(tag.id)
                    ? onRemoveTag(tag.id)
                    : onAddTag(tag.id)
                }
                isSelected={selectedIDs.has(tag.id)}
                ariaLabel={`${normalizeTagNameInput(tag.name)}、${tag.work_count}件`}
              >
                {normalizeTagNameInput(tag.name)} <span>{tag.work_count}</span>
              </Batch>
            ))
          ) : (
            <p className={styles["hint"]}>一致するタグはありません。</p>
          )}
        </CollapsibleTagList>
      ) : (
        <p className={styles["hint"]}>表示できるタグはありません。</p>
      )}
    </section>
  );
};

export default TagSelector;
