import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

interface UseWorkDetailParams {
  id: string;
}

interface UseWorkDetailReturn {
  data: Work | undefined;
}

const useWorkDetail = ({ id }: UseWorkDetailParams): UseWorkDetailReturn => {
  const url = `/works/${id}`;

  const fetcher = async (url: string): Promise<Work> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response } = useSWR<Work>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response,
  };
};

export default useWorkDetail;
