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
import PageMetadata from "@/shared/ui/PageMetadata";
import { useWorkPageSize } from "@/shared/ui/WorkCardGrid";

import type { TagListResponse } from "@/shared/types/work";

const TopPage = () => {
  const { key: locationKey } = useLocation();

  const [searchParams] = useSearchParams();
  const { currentPage } = getWorkIndexSelection({
    searchParams,
    allTags: [],
  });
  const accessToken = useAuthStore((state) => state.accessToken);
  const { itemsPerPage } = useWorkPageSize();
  const { cache, mutate } = useSWRConfig();

  const handleRetry = async () => {
    const tagKey = accessToken ? ["/tags", accessToken] : "/tags";
    const tagResponse = cache.get(unstable_serialize(tagKey))?.data as
      | TagListResponse
      | undefined;
    const { currentPage, selectedTags, sortOrder, visibility } =
      getWorkIndexSelection({
        searchParams,
        allTags: tagResponse?.tags ?? [],
      });
    await Promise.all([
      mutate(tagKey, undefined, { revalidate: true }),
      mutate(
        getWorksSWRKey(
          {
            page: currentPage,
            limit: itemsPerPage,
            tags: selectedTags,
            sortOrder,
            visibility: accessToken ? visibility : null,
          },
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
            <PageMetadata title="作品一覧" isNoIndex={currentPage > 1} />
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default TopPage;
