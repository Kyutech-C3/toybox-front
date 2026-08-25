import { Suspense } from "react";
import { useLocation } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";

const TopPage = () => {
  const { key: locationKey } = useLocation();

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary resetKey={locationKey}>
          <Suspense fallback={<PageLoading />}>
            <WorkIndex />
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default TopPage;
