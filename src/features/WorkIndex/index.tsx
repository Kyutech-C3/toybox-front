import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import styles from "./index.module.css";
import { SearchBar } from "./SearchBar";
import { useTagsStore } from "./SearchBar/store/useTagsStore";
import SortOrderSwitch from "./SortOrderSwitch";
import VisibilityFilter from "./VisibilityFilter";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid, {
  PageSizeSelect,
  useWorkGridColumns,
  useWorkPageSize,
} from "@/shared/ui/WorkCardGrid";

import type { CSSProperties } from "react";

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = useTagsStore();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentPage = Number(searchParams.get("page")) || 1;
  const { itemsPerPage } = useWorkPageSize();
  const { columns } = useWorkGridColumns();
  const controlsStyle = {
    "--work-card-columns": String(columns),
  } as CSSProperties;

  const { data, totalCount } = useWorks({
    page: currentPage,
    limit: itemsPerPage,
    tags: tags,
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
            ? (work) => <FavoriteButton workID={work.id} />
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
