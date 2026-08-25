import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";

const TopPage = () => {
  const { key: locationKey } = useLocation();

  const handleRetry = async () => {
    await mutate(
      (key) => {
        const requestPath = Array.isArray(key) ? key[0] : key;

        return (
          requestPath === "/tags" ||
          (typeof requestPath === "string" && requestPath.startsWith("/works?"))
        );
      },
      undefined,
      { revalidate: false },
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
