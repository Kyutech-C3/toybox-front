import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import { SearchBar } from "./SearchBar";
import { useTagsStore } from "./SearchBar/store/useTagsStore";

import { useUserStore } from "@/features/auth/store/useUserStore";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid, { useWorkGridPageSize } from "@/shared/ui/WorkCardGrid";

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = useTagsStore();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const currentPage = Number(searchParams.get("page")) || 1;
  const { itemsPerPage } = useWorkGridPageSize();

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

  if (!data) {
    return <div>作品がありません</div>;
  }

  return (
    <>
      <SearchBar />
      <WorkCardGrid works={data} viewerUserID={viewerUserID} />
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
