import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";
import { getWorksRequestPath } from "@/features/WorkIndex/hook/useWorks";
import { useTagsStore } from "@/features/WorkIndex/SearchBar/store/useTagsStore";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { useWorkPageSizeStore } from "@/shared/ui/WorkCardGrid/store/useWorkPageSizeStore";

const TopPage = () => {
  const { key: locationKey, search } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tags = useTagsStore((state) => state.tags);
  const pageSize = useWorkPageSizeStore((state) => state.pageSize);
  const currentPage = Number(new URLSearchParams(search).get("page")) || 1;

  const handleRetry = async () => {
    const worksRequestPath = getWorksRequestPath({
      page: currentPage,
      limit: pageSize,
      tags,
    });
    const worksKey = accessToken
      ? ([worksRequestPath, accessToken] as const)
      : worksRequestPath;
    await Promise.all(
      ["/tags", worksKey].map((key) =>
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
