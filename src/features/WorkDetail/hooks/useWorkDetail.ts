import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

interface UseWorkDetailReturn {
  data: Work | undefined;
  error: Error | undefined;
}

const useWorkDetail = (id: string): UseWorkDetailReturn => {
  const url = `/works/${id}`;

  const fetcher = async (url: string): Promise<Work> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response, error } = useSWR<Work>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response,
    error: error,
  };
};

export default useWorkDetail;
