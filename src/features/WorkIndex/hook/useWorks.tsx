import useSWR from "swr";

import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Tag, Work, WorkListResponse } from "@/shared/types/work";

interface UseWorksParams {
  page?: number;
  limit?: number;
  tags?: Tag[];
  accessToken?: string | null;
}

interface UseWorksReturn {
  data: Work[] | undefined;
  totalCount: number;
  currentPage: number;
  limit: number;
}

const getWorksRequestPath = ({ page, limit, tags }: UseWorksParams) => {
  const tagsQuery = tags?.map((tag) => tag.id).join(",") ?? "";
  let url = `/works?page=${page ?? 1}&limit=${limit ?? 21}`;

  if (tags && tags.length > 0) {
    url += `&tag_ids=${tagsQuery}`;
  }

  return url;
};

export const getWorksSWRKey = (params: UseWorksParams) => {
  const requestPath = getWorksRequestPath(params);
  return params.accessToken
    ? ([requestPath, params.accessToken] as const)
    : requestPath;
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
  accessToken,
}: UseWorksParams = {}): UseWorksReturn => {
  const swrKey = getWorksSWRKey({ page, limit, tags, accessToken });

  const { data: response } = useSWR<WorkListResponse>(
    swrKey,
    (requestKey) =>
      Array.isArray(requestKey)
        ? fetchWorks(requestKey[0], requestKey[1])
        : fetchWorks(requestKey),
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
