import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import CommentSection from "@/features/CommentSection";
import { getCommentSWRKey } from "@/features/CommentSection/hook/useComment";
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

    return error instanceof ApiError
      ? error.displayMessage
      : "画面の表示中に問題が発生しました";
  };

  const getCommentErrorMessage = (error: Error) => {
    return error instanceof ApiError
      ? error.displayMessage
      : "コメントの表示中に問題が発生しました";
  };

  const handleWorkRetry = async () => {
    if (!id) return;

    await mutate(`/works/${id}`, undefined, { revalidate: false });
  };

  const handleCommentRetry = async () => {
    if (!id) return;

    await mutate(getCommentSWRKey(id), undefined, { revalidate: false });
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary
          resetKey={locationKey}
          getErrorMessage={getErrorMessage}
          onRetry={handleWorkRetry}
        >
          <Suspense fallback={<PageLoading />}>
            {id ? (
              <>
                <WorkDetail workID={id} />
                <PageErrorBoundary
                  resetKey={locationKey}
                  getErrorMessage={getCommentErrorMessage}
                  isHomeActionVisible={false}
                  layout="section"
                  onRetry={handleCommentRetry}
                >
                  <Suspense fallback={<PageLoading layout="section" />}>
                    <CommentSection postId={id} />
                  </Suspense>
                </PageErrorBoundary>
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
