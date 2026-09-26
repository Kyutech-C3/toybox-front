import { Suspense } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { unstable_serialize, useSWRConfig } from "swr";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";
import { getWorkIndexSelection } from "@/features/WorkIndex/getWorkIndexSelection";
import { getWorksSWRKey } from "@/features/WorkIndex/hook/useWorks";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { useWorkPageSize } from "@/shared/ui/WorkCardGrid";

import type { TagListResponse } from "@/shared/types/work";

const TopPage = () => {
  const { key: locationKey } = useLocation();

  const [searchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { itemsPerPage } = useWorkPageSize();
  const { cache, mutate } = useSWRConfig();

  const handleRetry = async () => {
    const tagKey = accessToken ? ["/tags", accessToken] : "/tags";
    const tagResponse = cache.get(unstable_serialize(tagKey))?.data as
      | TagListResponse
      | undefined;
    const { currentPage, selectedTags } = getWorkIndexSelection({
      searchParams,
      allTags: tagResponse?.tags ?? [],
    });
    await Promise.all([
      mutate(tagKey, undefined, { revalidate: true }),
      mutate(
        getWorksSWRKey(
          { page: currentPage, limit: itemsPerPage, tags: selectedTags },
          accessToken,
        ),
        undefined,
        { revalidate: true },
      ),
    ]);
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
