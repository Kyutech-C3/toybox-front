import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Work, WorkListResponse } from "@/shared/types/work";

interface UseWorksParams {
  page?: number;
  limit?: number;
  tags?: string[];
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
  limit = 20,
  tags = [],
}: UseWorksParams = {}): UseWorksReturn => {
  const url = `/works?page=${page}&limit=${limit}`;

  const fetcher = async (url: string): Promise<WorkListResponse> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response, error } = useSWR<WorkListResponse>(url, fetcher, {
    suspense: true,
  });

  // TODO: タグ検索機能が出来次第こちらを利用し、タグによる絞り込み機能を実装する。
  console.log(tags);
  console.log(response);

  return {
    data: response?.works,
    totalCount: response?.total_count ?? 0,
    currentPage: response?.page ?? page,
    limit: response?.limit ?? limit,
    error,
  };
};

export default useWorks;
