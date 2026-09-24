import { useId, useMemo, useState } from "react";

import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
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
};

type TagViewMode = "popular" | "all-popular" | "all-name" | "results";

const POPULAR_TAG_LIMIT = 10;
const TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "popular", label: "人気" },
  { value: "all-popular", label: "全件・人気" },
  { value: "all-name", label: "全件・名前" },
  { value: "results", label: "検索" },
];

const TagSelector = ({
  allTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onClearTags,
  ariaLabel = "タグで作品を探す",
  searchPlaceholder = "タグで作品を探す",
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<TagViewMode>("popular");
  const panelID = useId();
  const selectedIDs = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags],
  );
  const tagsByPopularity = useMemo(
    () =>
      [...allTags].sort(
        (left, right) =>
          right.work_count - left.work_count ||
          normalizeTagNameInput(left.name).localeCompare(
            normalizeTagNameInput(right.name),
            "ja",
          ),
      ),
    [allTags],
  );
  const tagsByName = useMemo(
    () =>
      [...allTags].sort((left, right) =>
        normalizeTagNameInput(left.name).localeCompare(
          normalizeTagNameInput(right.name),
          "ja",
        ),
      ),
    [allTags],
  );
  const normalizedKeyword = normalizeTagNameInput(keyword).toLocaleLowerCase();
  const matchingTags = useMemo(
    () =>
      normalizedKeyword === ""
        ? []
        : tagsByPopularity
            .filter((tag) =>
              normalizeTagNameInput(tag.name)
                .toLocaleLowerCase()
                .includes(normalizedKeyword),
            )
            .sort(
              (left, right) =>
                Number(
                  normalizeTagNameInput(right.name)
                    .toLocaleLowerCase()
                    .startsWith(normalizedKeyword),
                ) -
                  Number(
                    normalizeTagNameInput(left.name)
                      .toLocaleLowerCase()
                      .startsWith(normalizedKeyword),
                  ) ||
                right.work_count - left.work_count ||
                normalizeTagNameInput(left.name).localeCompare(
                  normalizeTagNameInput(right.name),
                  "ja",
                ),
            ),
    [normalizedKeyword, tagsByPopularity],
  );
  const visibleTags =
    viewMode === "popular"
      ? tagsByPopularity
          .filter((tag) => tag.work_count > 0)
          .slice(0, POPULAR_TAG_LIMIT)
      : viewMode === "all-popular"
        ? tagsByPopularity
        : viewMode === "all-name"
          ? tagsByName
          : matchingTags;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const exactMatch = matchingTags.find(
      (tag) =>
        normalizeTagNameInput(tag.name).toLocaleLowerCase() ===
        normalizedKeyword,
    );
    const tagToAdd =
      exactMatch ?? matchingTags.find((tag) => !selectedIDs.has(tag.id));
    if (tagToAdd && !selectedIDs.has(tagToAdd.id)) onAddTag(tagToAdd.id);
  };

  return (
    <section className={styles["tag-search"]} aria-label={ariaLabel}>
      <form className={styles["search-form"]} onSubmit={handleSubmit}>
        <input
          type="search"
          aria-label={ariaLabel}
          placeholder={searchPlaceholder}
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setViewMode("results");
          }}
        />
      </form>

      <div className={styles["tag-browser"]}>
        <div className={styles["view-switch"]}>
          <SegmentedControl
            options={TAG_VIEW_OPTIONS}
            value={viewMode}
            onChange={setViewMode}
            role="tablist"
            ariaLabel="タグ一覧の表示"
            getOptionID={(value) => `${panelID}-${value}`}
            controlsID={panelID}
          />
        </div>
        <div
          id={panelID}
          className={styles["tag-panel"]}
          role="tabpanel"
          aria-labelledby={`${panelID}-${viewMode}`}
        >
          {visibleTags.length > 0 ? (
            <div
              className={styles["tag-list"]}
              data-scrollable={viewMode !== "popular" ? "true" : "false"}
            >
              {visibleTags.map((tag) => (
                <Batch
                  key={tag.id}
                  onSelect={() =>
                    selectedIDs.has(tag.id)
                      ? onRemoveTag(tag.id)
                      : onAddTag(tag.id)
                  }
                  isSelected={selectedIDs.has(tag.id)}
                  ariaLabel={`${normalizeTagNameInput(tag.name)}、${tag.work_count}作品`}
                >
                  {normalizeTagNameInput(tag.name)}{" "}
                  <span>{tag.work_count}</span>
                </Batch>
              ))}
            </div>
          ) : (
            <p className={styles["hint"]}>
              {viewMode === "results"
                ? normalizedKeyword === ""
                  ? "タグ名を入力してください。"
                  : "一致するタグはありません。"
                : "表示できるタグはありません。"}
            </p>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className={styles["selected-tags"]}>
          <div className={styles["section-heading"]}>
            <h2>選択中</h2>
            <button
              type="button"
              className={styles["clear-button"]}
              onClick={onClearTags}
            >
              すべて解除
            </button>
          </div>
          <div className={styles["tag-list"]}>
            {selectedTags.map((tag) => (
              <Batch
                key={tag.id}
                color="selected"
                ariaLabel={`${normalizeTagNameInput(tag.name)}を解除`}
                onClick={() => onRemoveTag(tag.id)}
              >
                {normalizeTagNameInput(tag.name)}
              </Batch>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default TagSelector;
