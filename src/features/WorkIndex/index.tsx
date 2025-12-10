import { Link, useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import styles from "./index.module.css";
import { SearchBar } from "./SearchBar";
import { useTagsStore } from "./store/useTagsStore";

import { Pagination } from "@/features/WorkIndex/Pagenation";
import Card from "@/shared/ui/Card";

const ITEMS_PER_PAGE = 20;

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = useTagsStore();
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data, totalCount, error } = useWorks({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    tags: tags,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  if (!data) {
    return <div>作品がありません</div>;
  }

  return (
    <>
      <SearchBar />
      <div className={styles["works-index"]}>
        {data.map((work) => (
          <Link
            key={work.id}
            to={`/work/${work.id}`}
            className={styles["work-link"]}
          >
            <Card
              key={work.id}
              title={
                work.title.length > 14
                  ? `${work.title.slice(0, 14)}...`
                  : work.title
              }
              tags={["test", "mock"]}
              imageURL={
                work.assets[0].asset_type === "image"
                  ? work.assets[0].url
                  : undefined
              }
              postDate={new Date(work.created_at.split(" ")[0])}
            />
          </Link>
        ))}
      </div>
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
