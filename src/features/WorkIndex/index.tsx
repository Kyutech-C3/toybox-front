import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { getWorkIndexSelection } from "./getWorkIndexSelection";
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
  useWorkPageSize,
  WorkListControls,
} from "@/shared/ui/WorkCardGrid";

const WorkIndex = () => {
  const paginationRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allTags } = useTagOptions();
  const {
    searchableTags,
    selectedTagIDs,
    selectedTags,
    currentPage,
    sortOrder,
    visibility,
  } = getWorkIndexSelection({ searchParams, allTags });
  const normalizedTags = selectedTagIDs.join(",");
  const viewerUserID = useUserStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { itemsPerPage } = useWorkPageSize();

  const { data, totalCount } = useWorks({
    page: currentPage,
    limit: itemsPerPage,
    tags: selectedTags,
    sortOrder,
    visibility: accessToken ? visibility : null,
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

  const handleSortChange = (value: typeof sortOrder) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "oldest") next.set("sort", value);
      else next.delete("sort");
      next.delete("page");
      return next;
    });
  };

  const handleVisibilityChange = (value: typeof visibility) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set("visibility", value);
      else next.delete("visibility");
      next.delete("page");
      return next;
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(page));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToPagination = () => {
    paginationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <>
      <div className={styles["work-index-header"]}>
        <TagSelector
          searchPlaceholder="タグを検索"
          allTags={searchableTags}
          selectedTags={selectedTags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClearTags={() => updateTags([])}
        />
        <WorkListControls
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onPagePositionClick={handleScrollToPagination}
          filterControls={
            accessToken && (
              <VisibilityFilter
                value={visibility}
                onChange={handleVisibilityChange}
              />
            )
          }
          sortControl={
            <SortOrderSwitch value={sortOrder} onChange={handleSortChange} />
          }
        />
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
        <div ref={paginationRef}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default WorkIndex;
