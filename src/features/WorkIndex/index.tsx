import { useSearchParams } from "react-router-dom";

import useWorks from "./hook/useWorks";
import styles from "./index.module.css";

import { Pagination } from "@/features/Pagenation";
import Card from "@/shared/ui/Card";

const ITEMS_PER_PAGE = 20;

const WorkIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data, totalCount, error, isLoading } = useWorks({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  if (!data) {
    return <div>データがありません</div>;
  }

  return (
    <>
      <div className={styles["works-index"]}>
        {data.map((work) => (
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
