import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkIndex, { useWorkIndexRequest } from "@/features/WorkIndex";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";

const TopPage = () => {
  const { key: locationKey } = useLocation();
  const { swrKey } = useWorkIndexRequest();

  const handleRetry = async () => {
    await Promise.all(
      ["/tags", swrKey].map((key) =>
        mutate(key, undefined, { revalidate: true }),
      ),
    );
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary resetKey={locationKey} onRetry={handleRetry}>
          <Suspense fallback={<PageLoading />}>
            <WorkIndex />
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default TopPage;
