import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Tag, Work, WorkListResponse } from "@/shared/types/work";

interface UseWorksParams {
  page?: number;
  limit?: number;
  tags?: Tag[];
}

interface UseWorksReturn {
  data: Work[] | undefined;
  totalCount: number;
  currentPage: number;
  limit: number;
}

const buildWorksUrl = ({ page, limit, tags }: UseWorksParams) => {
  const tagsQuery = tags?.map((tag) => tag.id).join(",") ?? "";
  let url = `/works?page=${page ?? 1}&limit=${limit ?? 21}`;

  if (tags && tags.length > 0) {
    url += `&tag_ids=${tagsQuery}`;
  }

  return url;
};

const fetchWorks = async (
  url: string,
  accessToken?: string,
): Promise<WorkListResponse> => {
  if (!accessToken) {
    return fetchData(url);
  }

  return fetchDataWithAuth(url, accessToken);
};

const useWorks = ({
  page = 1,
  limit = 21,
  tags = [],
}: UseWorksParams = {}): UseWorksReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const url = buildWorksUrl({ page, limit, tags });

  const { data: response } = useSWR<WorkListResponse>(
    accessToken ? [url, accessToken] : url,
    accessToken
      ? ([requestUrl, token]) => fetchWorks(requestUrl, token)
      : (requestUrl) => fetchWorks(requestUrl),
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
