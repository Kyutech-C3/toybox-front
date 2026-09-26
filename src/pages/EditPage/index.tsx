import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSWRConfig } from "swr";

import styles from "./index.module.css";

import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Header from "@/features/Header";
import WorkEditor from "@/features/WorkEditor";
import { getWorkEditorSWRKey } from "@/features/WorkEditor/hook/useWorkForEdit";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { ApiError } from "@/util/fetchData";

type EditPageProps = {
  isNewWork?: boolean;
};

const EditPage = ({ isNewWork = false }: EditPageProps) => {
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();
  const { mutate } = useSWRConfig();
  const accessToken = useAuthStore((state) => state.accessToken);
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
    await Promise.all([
      mutate(accessToken ? ["/tags", accessToken] : "/tags", undefined, {
        revalidate: true,
      }),
      ...(workID
        ? [
            mutate(getWorkEditorSWRKey({ workID, accessToken }), undefined, {
              revalidate: true,
            }),
          ]
        : []),
    ]);
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <ProtectedRoute>
          <PageErrorBoundary
            resetKey={locationKey}
            getErrorMessage={getErrorMessage}
            onRetry={handleRetry}
          >
            <Suspense fallback={<PageLoading />}>
              <WorkEditor workID={workID} />
            </Suspense>
          </PageErrorBoundary>
        </ProtectedRoute>
      </main>
    </>
  );
};

export default EditPage;
