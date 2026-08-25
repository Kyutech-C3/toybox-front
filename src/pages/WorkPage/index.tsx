import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";

import styles from "./index.module.css";

import CommentSection from "@/features/CommentSection";
import Header from "@/features/Header";
import WorkDetail from "@/features/WorkDetail";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { ApiError } from "@/util/fetchData";

const WorkPage = () => {
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();

  const getErrorMessage = (error: Error) => {
    if (error instanceof ApiError && error.status === 404) {
      return "作品が見つかりません";
    }

    return "データを取得できませんでした";
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary
          resetKey={locationKey}
          getErrorMessage={getErrorMessage}
        >
          <Suspense fallback={<PageLoading />}>
            {id ? (
              <>
                <WorkDetail workID={id} />
                <CommentSection postId={id} />
              </>
            ) : (
              <h1>作品がありません</h1>
            )}
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default WorkPage;
