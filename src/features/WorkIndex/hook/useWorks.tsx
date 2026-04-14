import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

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
  error: Error | undefined;
}

const useWorks = ({
  page = 1,
  limit = 21,
  tags = [],
}: UseWorksParams = {}): UseWorksReturn => {
  const tagsQuery = tags.map((tag) => `${tag.id}`).join(",");
  let url = `/works?page=${page}&limit=${limit}`;

  if (tags.length > 0) {
    url += `&tag_ids=${tagsQuery}`;
  }
  const fetcher = async (url: string): Promise<WorkListResponse> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response, error } = useSWR<WorkListResponse>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response?.works,
    totalCount: response?.total_count ?? 0,
    currentPage: response?.page ?? page,
    limit: response?.limit ?? limit,
    error,
  };
};

export default useWorks;
