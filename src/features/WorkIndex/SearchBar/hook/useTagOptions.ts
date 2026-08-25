import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Tag, TagListResponse } from "@/shared/types/work";

interface UseTagOptionsReturn {
  data: Tag[];
}

const useTagOptions = (): UseTagOptionsReturn => {
  const url = "/tags";

  const fetcher = async (url: string): Promise<TagListResponse> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response } = useSWR<TagListResponse>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response?.tags ?? [],
  };
};

export default useTagOptions;
