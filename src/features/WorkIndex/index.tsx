import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import { SearchBar } from "./SearchBar";
import { useTagsStore } from "./SearchBar/store/useTagsStore";

import { useUserStore } from "@/features/auth/store/useUserStore";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid from "@/shared/ui/WorkCardGrid";

const ITEMS_PER_PAGE = 21;

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = useTagsStore();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data, totalCount } = useWorks({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    tags: tags,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
