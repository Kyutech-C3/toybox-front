import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSWRConfig } from "swr";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import CommentSection from "@/features/CommentSection";
import { getCommentSWRKey } from "@/features/CommentSection/hook/useComment";
import Header from "@/features/Header";
import WorkDetail from "@/features/WorkDetail";
import useWorkDetail, {
  getWorkDetailSWRKey,
} from "@/features/WorkDetail/hook/useWorkDetail";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import PageMetadata from "@/shared/ui/PageMetadata";
import { ApiError } from "@/util/fetchData";
import { getMarkdownText } from "@/util/getMarkdownText";

type WorkPageContentProps = {
  id: string;
  locationKey: string;
};

const WorkPageContent = ({ id, locationKey }: WorkPageContentProps) => {
  const { data } = useWorkDetail({ id });
  const { mutate } = useSWRConfig();
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!data) {
    return (
      <>
        <PageMetadata title="作品が見つかりません" />
        <div>データがありません</div>
      </>
    );
  }

  const getCommentErrorMessage = (error: Error) => {
    return error instanceof ApiError
      ? error.displayMessage
      : "コメントの表示中に問題が発生しました";
  };

  const handleCommentRetry = async () => {
    await mutate(getCommentSWRKey(id, accessToken), undefined, {
      revalidate: true,
    });
  };

  return (
    <>
      <PageMetadata
        title={data.title}
        description={getMarkdownText(data.description)}
      />
      <WorkDetail data={data} />
      {data.visibility !== "draft" && (
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
      )}
    </>
  );
};

const WorkPage = () => {
  const { mutate } = useSWRConfig();
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);

  const getErrorMessage = (error: Error) => {
    if (error instanceof ApiError && error.status === 404) {
      return "作品が見つかりません";
    }

    return error instanceof ApiError
      ? error.displayMessage
      : "画面の表示中に問題が発生しました";
  };

  const handleWorkRetry = async () => {
    if (!id) return;

    await mutate(getWorkDetailSWRKey(id, accessToken), undefined, {
      revalidate: true,
    });
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
          <Suspense key={id} fallback={<PageLoading />}>
            {id ? (
              <WorkPageContent id={id} locationKey={locationKey} />
            ) : (
              <>
                <PageMetadata title="作品がありません" />
                <h1>作品がありません</h1>
              </>
            )}
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default WorkPage;
