import { Suspense, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkEditor from "@/features/WorkEditor";
import { usePostWorkStore } from "@/features/WorkEditor/store/usePostWorkStore";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";

type EditPageProps = {
  isNewWork?: boolean;
};

const EditPage = ({ isNewWork = false }: EditPageProps) => {
  const { key: locationKey } = useLocation();
  const resetPostWork = usePostWorkStore((state) => state.resetPostWork);

  useLayoutEffect(() => {
    if (isNewWork) resetPostWork();
  }, [isNewWork, resetPostWork]);

  const handleRetry = async () => {
    await mutate("/tags", undefined, { revalidate: false });
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary resetKey={locationKey} onRetry={handleRetry}>
          <Suspense fallback={<PageLoading />}>
            <WorkEditor />
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default EditPage;
