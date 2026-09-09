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
  useWorkPageSize,
} from "@/shared/ui/WorkCardGrid";

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = useTagsStore();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentPage = Number(searchParams.get("page")) || 1;
  const { itemsPerPage } = useWorkPageSize();

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
      <div className={styles["work-index-controls"]}>
        <div className={styles["controls-left"]}>
          {accessToken && <VisibilityFilter />}
          <SortOrderSwitch />
        </div>
        <div className={styles["controls-center"]}>
          <SearchBar />
        </div>
        <div className={styles["controls-right"]}>
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
