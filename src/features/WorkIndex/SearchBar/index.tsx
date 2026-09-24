import { useId, useMemo, useState } from "react";

import styles from "./index.module.css";

import SegmentedControl from "@/shared/ui/SegmentedControl";

import type { FormEvent } from "react";
import type { TagDetail } from "@/shared/types/work";
import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";

type SearchBarProps = {
  allTags: TagDetail[];
  selectedTags: TagDetail[];
  onAddTag: (tagID: string) => void;
  onRemoveTag: (tagID: string) => void;
  onClearTags: () => void;
};

type TagViewMode = "popular" | "all-popular" | "all-name" | "results";

const POPULAR_TAG_LIMIT = 10;
const TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "popular", label: "人気" },
  { value: "all-popular", label: "全件・人気" },
  { value: "all-name", label: "全件・名前" },
  { value: "results", label: "検索" },
];

export const SearchBar = ({
  allTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onClearTags,
}: SearchBarProps) => {
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
          left.name.localeCompare(right.name, "ja"),
      ),
    [allTags],
  );
  const tagsByName = useMemo(
    () =>
      [...allTags].sort((left, right) =>
        left.name.localeCompare(right.name, "ja"),
      ),
    [allTags],
  );
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  const matchingTags = useMemo(
    () =>
      normalizedKeyword === ""
        ? []
        : tagsByPopularity
            .filter((tag) =>
              tag.name.toLocaleLowerCase().includes(normalizedKeyword),
            )
            .sort(
              (left, right) =>
                Number(
                  right.name.toLocaleLowerCase().startsWith(normalizedKeyword),
                ) -
                  Number(
                    left.name.toLocaleLowerCase().startsWith(normalizedKeyword),
                  ) ||
                right.work_count - left.work_count ||
                left.name.localeCompare(right.name, "ja"),
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
    const firstUnselectedTag = matchingTags.find(
      (tag) => !selectedIDs.has(tag.id),
    );
    if (firstUnselectedTag) onAddTag(firstUnselectedTag.id);
  };

  return (
    <section className={styles["tag-search"]} aria-label="タグで作品を探す">
      <form className={styles["search-form"]} onSubmit={handleSubmit}>
        <input
          type="search"
          aria-label="タグで作品を探す"
          placeholder="タグで作品を探す"
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
                <button
                  key={tag.id}
                  type="button"
                  className={styles["tag-button"]}
                  aria-pressed={selectedIDs.has(tag.id)}
                  onClick={() =>
                    selectedIDs.has(tag.id)
                      ? onRemoveTag(tag.id)
                      : onAddTag(tag.id)
                  }
                >
                  <span>{tag.name}</span>
                  <span className={styles["tag-count"]}>
                    {tag.work_count}作品
                  </span>
                </button>
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
              <button
                key={tag.id}
                type="button"
                className={styles["selected-tag"]}
                aria-label={`${tag.name}を解除`}
                onClick={() => onRemoveTag(tag.id)}
              >
                {tag.name} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
