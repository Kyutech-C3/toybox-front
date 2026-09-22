import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useWorkIndexRequest from "./hook/useWorkIndexRequest";
import useWorks from "./hook/useWorks";
import styles from "./index.module.css";
import { SearchBar } from "./SearchBar";
import SortOrderSwitch from "./SortOrderSwitch";
import VisibilityFilter from "./VisibilityFilter";

import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid, {
  PageSizeSelect,
  useWorkGridColumns,
} from "@/shared/ui/WorkCardGrid";

import type { CSSProperties } from "react";

const WorkIndex = () => {
  const [, setSearchParams] = useSearchParams();
  const { accessToken, currentPage, itemsPerPage, tags } =
    useWorkIndexRequest();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const { columns } = useWorkGridColumns();
  const controlsStyle = {
    "--work-card-columns": String(columns),
  } as CSSProperties;

  const { data, totalCount } = useWorks({
    page: currentPage,
    limit: itemsPerPage,
    tags: tags,
    accessToken,
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setSearchParams({ page: String(totalPages) }, { replace: true });
    }
  }, [currentPage, totalPages, setSearchParams]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles["work-index-controls"]} style={controlsStyle}>
        {accessToken && <VisibilityFilter />}
        <SortOrderSwitch />
        <div className={styles["controls-search"]}>
          <SearchBar />
        </div>
        <div className={styles["controls-page-size"]}>
          <PageSizeSelect />
        </div>
      </div>
      <WorkCardGrid
        works={data ?? []}
        viewerUserID={viewerUserID}
        emptyMessage={
          tags.length > 0
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

export { default as useWorkIndexRequest } from "./hook/useWorkIndexRequest";
export default WorkIndex;
