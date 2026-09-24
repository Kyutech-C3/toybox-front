import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import styles from "./index.module.css";
import SortOrderSwitch from "./SortOrderSwitch";
import VisibilityFilter from "./VisibilityFilter";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import useTagOptions from "@/features/Tag/hook/useTagOptions";
import { Pagination } from "@/shared/ui/Pagination";
import TagSelector from "@/shared/ui/TagSelector";
import WorkCardGrid, {
  PageSizeSelect,
  useWorkGridColumns,
  useWorkPageSize,
} from "@/shared/ui/WorkCardGrid";

import type { CSSProperties } from "react";

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allTags } = useTagOptions();
  const tagsByID = new Map(allTags.map((tag) => [tag.id, tag]));
  const requestedTagIDs = searchParams.get("tags")?.split(",") ?? [];
  const selectedTagIDs = [...new Set(requestedTagIDs)].filter((tagID) =>
    tagsByID.has(tagID),
  );
  const normalizedTags = selectedTagIDs.join(",");
  const selectedTags = selectedTagIDs.flatMap((tagID) => {
    const tag = tagsByID.get(tagID);
    return tag ? [tag] : [];
  });
  const viewerUserID = useUserStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const { itemsPerPage } = useWorkPageSize();
  const { columns } = useWorkGridColumns();
  const controlsStyle = {
    "--work-card-columns": String(columns),
  } as CSSProperties;

  const { data, totalCount } = useWorks({
    page: currentPage,
    limit: itemsPerPage,
    tags: selectedTags,
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    const nextPage = Math.min(currentPage, Math.max(totalPages, 1));
    if (
      searchParams.get("tags") !== (normalizedTags || null) ||
      (searchParams.has("page") &&
        searchParams.get("page") !== String(nextPage))
    ) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (normalizedTags) next.set("tags", normalizedTags);
          else next.delete("tags");
          if (nextPage > 1 || current.has("page")) {
            next.set("page", String(nextPage));
          }
          return next;
        },
        { replace: true },
      );
    }
  }, [currentPage, normalizedTags, searchParams, setSearchParams, totalPages]);

  const updateTags = (tagIDs: string[]) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tagIDs.length > 0) next.set("tags", tagIDs.join(","));
      else next.delete("tags");
      next.delete("page");
      return next;
    });
  };

  const handleAddTag = (tagID: string) => {
    if (!selectedTagIDs.includes(tagID)) {
      updateTags([...selectedTagIDs, tagID]);
    }
  };

  const handleRemoveTag = (tagID: string) => {
    updateTags(selectedTagIDs.filter((selectedID) => selectedID !== tagID));
  };

  const handlePageChange = (page: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(page));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles["work-index-header"]} style={controlsStyle}>
        <div className={styles["work-index-controls"]}>
          <div className={styles["left-controls"]}>
            {accessToken && <VisibilityFilter />}
            <SortOrderSwitch />
          </div>
          <TagSelector
            allTags={allTags}
            selectedTags={selectedTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onClearTags={() => updateTags([])}
          />
          <div className={styles["controls-page-size"]}>
            <PageSizeSelect />
          </div>
        </div>
        <p className={styles["result-count"]}>作品一覧 · {totalCount}件</p>
      </div>
      <WorkCardGrid
        works={data ?? []}
        viewerUserID={viewerUserID}
        emptyMessage={
          selectedTags.length > 0
            ? "選んだタグに合う作品はありません。"
            : "作品はありません。"
        }
        renderFavoriteButton={
          viewerUserID
            ? (work) => (
                <FavoriteButton
                  workID={work.id}
                  isInitiallyLiked={work.is_favorite}
                />
              )
            : undefined
        }
      />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
};

export default WorkIndex;
