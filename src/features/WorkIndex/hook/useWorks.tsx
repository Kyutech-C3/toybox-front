import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Work, WorkListResponse } from "@/shared/types/work";

interface UseWorksParams {
  page?: number;
  limit?: number;
}

interface UseWorksReturn {
  data: Work[] | undefined;
  totalCount: number;
  currentPage: number;
  limit: number;
  error: Error | undefined;
  isLoading: boolean;
}

const useWorks = ({
  page = 1,
  limit = 20,
}: UseWorksParams = {}): UseWorksReturn => {
  const url = `/works?page=${page}&limit=${limit}`;

  const fetcher = async (url: string): Promise<WorkListResponse> => {
    const response = await fetchData(url);
    return response;
  };

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<WorkListResponse>(url, fetcher);

  return {
    data: response?.works,
    totalCount: response?.total_count ?? 0,
    currentPage: response?.page ?? page,
    limit: response?.limit ?? limit,
    error,
    isLoading,
  };
};

export default useWorks;
