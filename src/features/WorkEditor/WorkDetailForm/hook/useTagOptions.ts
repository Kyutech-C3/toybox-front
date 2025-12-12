import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Tag, TagListResponse } from "@/shared/types/work";

interface UseTagOptionsReturn {
  data: Tag[];
  error: Error | undefined;
}

const useTagOptions = (): UseTagOptionsReturn => {
  const url = "/tags";

  const fetcher = async (url: string): Promise<TagListResponse> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response, error } = useSWR<TagListResponse>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response?.tags ?? [],
    error: error,
  };
};

export default useTagOptions;
