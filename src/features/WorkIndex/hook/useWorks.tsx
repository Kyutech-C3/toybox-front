import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Tag, Work, WorkListResponse } from "@/shared/types/work";
import type {
  SortOrder,
  VisibilityFilterValue,
} from "../getWorkIndexSelection";

interface UseWorksParams {
  page?: number;
  limit?: number;
  tags?: Tag[];
  sortOrder?: SortOrder;
  visibility?: VisibilityFilterValue | null;
}

interface UseWorksReturn {
  data: Work[] | undefined;
  totalCount: number;
  currentPage: number;
  limit: number;
}

const buildWorksUrl = ({
  page,
  limit,
  tags,
  sortOrder,
  visibility,
}: UseWorksParams) => {
  const tagsQuery = tags?.map((tag) => tag.id).join(",") ?? "";
  let url = `/works?page=${page ?? 1}&limit=${limit ?? 21}`;

  if (tags && tags.length > 0) {
    url += `&tag_ids=${tagsQuery}`;
  }
  if (sortOrder === "oldest") url += "&sort=oldest";
  if (visibility) url += `&visibility=${visibility}`;

  return url;
};

export const getWorksSWRKey = (
  params: UseWorksParams,
  isAuthenticated: boolean,
) => {
  const url = buildWorksUrl(params);
  return isAuthenticated ? ([url, true] as const) : url;
};

const useWorks = ({
  page = 1,
  limit = 21,
  tags = [],
  sortOrder = "newest",
  visibility = null,
}: UseWorksParams = {}): UseWorksReturn => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: response } = useSWR<WorkListResponse>(
    getWorksSWRKey(
      { page, limit, tags, sortOrder, visibility },
      isAuthenticated,
    ),
    isAuthenticated
      ? ([requestUrl]: [string]) => fetchDataWithAuth(requestUrl)
      : (requestUrl: string) => fetchData(requestUrl),
    { suspense: true },
  );

  return {
    data: response?.works,
    totalCount: response?.total_count ?? 0,
    currentPage: response?.page ?? page,
    limit: response?.limit ?? limit,
  };
};

export default useWorks;
