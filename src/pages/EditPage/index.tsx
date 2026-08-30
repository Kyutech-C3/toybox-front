import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkEditor, { isWorkEditorSWRKey } from "@/features/WorkEditor";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { ApiError } from "@/util/fetchData";

type EditPageProps = {
  isNewWork?: boolean;
};

const EditPage = ({ isNewWork = false }: EditPageProps) => {
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();
  const workID = isNewWork ? null : (id ?? null);

  const getErrorMessage = (error: Error) => {
    if (error instanceof ApiError && error.status === 404) {
      return "作品が見つかりません";
    }
    if (error instanceof ApiError && error.status === 403) {
      return "この作品を編集する権限がありません";
    }

    return error instanceof ApiError
      ? error.displayMessage
      : "画面の表示中に問題が発生しました";
  };

  const handleRetry = async () => {
    await mutate(
      (key) => key === "/tags" || isWorkEditorSWRKey(key),
      undefined,
      { revalidate: false },
    );
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary
          resetKey={locationKey}
          getErrorMessage={getErrorMessage}
          onRetry={handleRetry}
        >
          <Suspense fallback={<PageLoading />}>
            <WorkEditor workID={workID} />
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default EditPage;
