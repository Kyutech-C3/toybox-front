import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { getVisiblePopularTagCount } from "./getVisiblePopularTagCount";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
import Input from "@/shared/ui/Input";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import { normalizeTagNameInput } from "@/util/tagName";

import type { FormEvent, ReactNode } from "react";
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
  layout?: "default" | "top-page" | "editor";
  onCreateTag?: (tagName: string) => Promise<boolean>;
  leadingControls?: ReactNode;
  trailingControls?: ReactNode;
};

type TagViewMode = "popular" | "all-popular" | "all-name";

const TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "popular", label: "多い順" },
  { value: "all-popular", label: "全件多い順" },
  { value: "all-name", label: "全件名前順" },
];

const TagSelector = ({
  allTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onClearTags,
  ariaLabel = "タグで作品を探す",
  searchPlaceholder = "タグで作品を探す",
  layout = "default",
  onCreateTag,
  leadingControls,
  trailingControls,
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<TagViewMode>("popular");
  const [isCreating, setCreating] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const measureListRef = useRef<HTMLDivElement>(null);
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
  const tagName = normalizeTagNameInput(keyword);
  const canCreateTag =
    tagName !== "" &&
    !allTags.some(
      (tag) =>
        normalizeTagNameInput(tag.name).toLocaleLowerCase() ===
        normalizedKeyword,
    );
  const sortedTags = viewMode === "all-name" ? tagsByName : tagsByPopularity;
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
  useLayoutEffect(() => {
    if (viewMode !== "popular") return;

    const measureList = measureListRef.current;
    if (!measureList) return;

    let isActive = true;
    const measure = () => {
      if (!isActive) return;
      const items = Array.from(measureList.children) as HTMLElement[];
      const tagWidths = items
        .slice(0, tagsByPopularity.length)
        .map((item) => item.getBoundingClientRect().width);
      const expandWidth = items.at(-1)?.getBoundingClientRect().width ?? 0;
      const availableWidth = measureList.clientWidth;
      const gap =
        Number.parseFloat(getComputedStyle(measureList).columnGap) || 0;
      if (availableWidth === 0) return;
      setVisibleTagCount(
        getVisiblePopularTagCount(tagWidths, expandWidth, availableWidth, gap),
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(measureList);
    void document.fonts.ready.then(measure);
    measure();

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [viewMode, tagsByPopularity]);

  const visibleTags =
    viewMode === "popular"
      ? tagsByPopularity.slice(0, visibleTagCount)
      : matchingTags;
  const isPopularTruncated =
    viewMode === "popular" && visibleTagCount < tagsByPopularity.length;
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
    <section
      className={styles["tag-search"]}
      aria-label={ariaLabel}
      data-layout={layout}
      data-view-mode={viewMode}
    >
      {layout === "top-page" && (
        <div className={styles["controls-row"]}>
          <div className={styles["leading-controls"]}>{leadingControls}</div>
          <div className={styles["trailing-controls"]}>{trailingControls}</div>
        </div>
      )}
      <form className={styles["search-form"]} onSubmit={handleSubmit}>
        <div className={styles["search-input"]}>
          <Input
            type="search"
            aria-label={ariaLabel}
            placeholder={searchPlaceholder}
            value={keyword}
            readOnly={isCreating}
            maxLength={onCreateTag ? 50 : undefined}
            isCharacterCountVisible={!!onCreateTag}
            data-character-count-control={onCreateTag ? true : undefined}
            onChange={(nextKeyword) => {
              setKeyword(nextKeyword);
              if (viewMode === "popular" && normalizeTagNameInput(nextKeyword))
                setViewMode("all-popular");
            }}
          />
        </div>
        {onCreateTag && (
          <button
            type="button"
            className={styles["create-button"]}
            disabled={!canCreateTag || isCreating}
            onClick={() => void handleCreateTag()}
          >
            {isCreating ? "作成中…" : "新規作成"}
          </button>
        )}
      </form>

      <div className={styles["tag-browser"]}>
        <div className={styles["view-switch"]}>
          <SegmentedControl
            options={TAG_VIEW_OPTIONS}
            value={viewMode}
            onChange={(mode) => {
              if (mode === "popular") setKeyword("");
              setViewMode(mode);
            }}
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
          {visibleTags.length > 0 || isPopularTruncated ? (
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
                  ariaLabel={`${normalizeTagNameInput(tag.name)}、${tag.work_count}件`}
                >
                  {normalizeTagNameInput(tag.name)}{" "}
                  <span>{tag.work_count}件</span>
                </Batch>
              ))}
              {isPopularTruncated && (
                <button
                  type="button"
                  className={styles["expand-button"]}
                  onClick={() => setViewMode("all-popular")}
                  aria-controls={panelID}
                >
                  全件表示
                </button>
              )}
            </div>
          ) : (
            <p className={styles["hint"]}>
              {normalizedKeyword === ""
                ? "表示できるタグはありません。"
                : "一致するタグはありません。"}
            </p>
          )}
        </div>
        {viewMode === "popular" && (
          <div
            ref={measureListRef}
            className={`${styles["tag-list"]} ${styles["measure-list"]}`}
            aria-hidden="true"
          >
            {tagsByPopularity.map((tag) => (
              <Batch key={tag.id}>
                {normalizeTagNameInput(tag.name)}{" "}
                <span>{tag.work_count}件</span>
              </Batch>
            ))}
            <button
              type="button"
              className={styles["expand-button"]}
              tabIndex={-1}
            >
              全件表示
            </button>
          </div>
        )}
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
              選択解除
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
