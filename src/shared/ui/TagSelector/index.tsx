import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getVisiblePopularTagCount } from "./getVisiblePopularTagCount";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
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
  layout?: "default" | "top-page";
  leadingControls?: ReactNode;
  trailingControls?: ReactNode;
};

type TagViewMode = "popular" | "all-popular" | "all-name" | "results";

const POPULAR_TAG_LIMIT = 10;
const TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "popular", label: "人気" },
  { value: "all-popular", label: "全件・人気" },
  { value: "all-name", label: "全件・名前" },
  { value: "results", label: "検索" },
];
const TOP_PAGE_TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "popular", label: "多い順" },
  { value: "all-popular", label: "全件多い順" },
  { value: "all-name", label: "名前順" },
  { value: "results", label: "検索" },
];
const MOBILE_TAG_VIEW_OPTIONS: SegmentedControlOption<TagViewMode>[] = [
  { value: "all-popular", label: "多い順" },
  { value: "all-name", label: "名前順" },
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
  layout = "default",
  leadingControls,
  trailingControls,
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<TagViewMode>("popular");
  const [isMobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const [visibleTagCount, setVisibleTagCount] = useState(POPULAR_TAG_LIMIT);
  const measureListRef = useRef<HTMLDivElement>(null);
  const panelID = useId();
  const activeViewMode =
    layout === "top-page" && isMobile && viewMode === "popular"
      ? "all-popular"
      : viewMode;
  useEffect(() => {
    if (layout !== "top-page") return;
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setMobile(mobileQuery.matches);
    mobileQuery.addEventListener("change", updateMobile);
    updateMobile();
    return () => mobileQuery.removeEventListener("change", updateMobile);
  }, [layout]);
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
  useLayoutEffect(() => {
    if (layout !== "top-page" || activeViewMode !== "popular") return;

    const measureList = measureListRef.current;
    if (!measureList) return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    let isActive = true;
    const measure = () => {
      if (!isActive) return;
      if (!desktopQuery.matches) {
        setVisibleTagCount(tagsByPopularity.length);
        return;
      }

      const items = Array.from(measureList.children) as HTMLElement[];
      const tagWidths = items
        .slice(0, -1)
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
    desktopQuery.addEventListener("change", measure);
    void document.fonts.ready.then(measure);
    measure();

    return () => {
      isActive = false;
      observer.disconnect();
      desktopQuery.removeEventListener("change", measure);
    };
  }, [layout, activeViewMode, tagsByPopularity]);

  const visibleTags =
    activeViewMode === "popular"
      ? layout === "top-page"
        ? tagsByPopularity.slice(0, visibleTagCount)
        : tagsByPopularity
            .filter((tag) => tag.work_count > 0)
            .slice(0, POPULAR_TAG_LIMIT)
      : activeViewMode === "all-popular"
        ? tagsByPopularity
        : activeViewMode === "all-name"
          ? tagsByName
          : layout === "top-page" && normalizedKeyword === ""
            ? tagsByPopularity
            : matchingTags;
  const isPopularTruncated =
    layout === "top-page" &&
    activeViewMode === "popular" &&
    visibleTagCount < tagsByPopularity.length;
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
    <section
      className={styles["tag-search"]}
      aria-label={ariaLabel}
      data-layout={layout}
      data-view-mode={activeViewMode}
    >
      {layout === "top-page" && (
        <div className={styles["controls-row"]}>
          <div className={styles["leading-controls"]}>{leadingControls}</div>
          <div className={styles["trailing-controls"]}>{trailingControls}</div>
        </div>
      )}
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
            options={
              layout === "top-page"
                ? isMobile
                  ? MOBILE_TAG_VIEW_OPTIONS
                  : TOP_PAGE_TAG_VIEW_OPTIONS
                : TAG_VIEW_OPTIONS
            }
            value={activeViewMode}
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
          aria-labelledby={`${panelID}-${activeViewMode}`}
        >
          {visibleTags.length > 0 || isPopularTruncated ? (
            <div
              className={styles["tag-list"]}
              data-scrollable={activeViewMode !== "popular" ? "true" : "false"}
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
              {activeViewMode === "results"
                ? normalizedKeyword === ""
                  ? "タグ名を入力してください。"
                  : "一致するタグはありません。"
                : "表示できるタグはありません。"}
            </p>
          )}
        </div>
        {layout === "top-page" && activeViewMode === "popular" && (
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
              {layout === "top-page" ? "選択解除" : "すべて解除"}
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
