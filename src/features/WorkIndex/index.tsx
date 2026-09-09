import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import styles from "./index.module.css";
import { SearchBar } from "./SearchBar";
import { useTagsStore } from "./SearchBar/store/useTagsStore";

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
        <SearchBar />
        <div className={styles["work-index-tools"]}>
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
