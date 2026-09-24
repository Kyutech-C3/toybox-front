import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { TagDetail, TagListResponse } from "@/shared/types/work";

interface UseTagOptionsReturn {
  data: TagDetail[];
}

const useTagOptions = (): UseTagOptionsReturn => {
  const url = "/tags";
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data: response } = useSWR<TagListResponse>(
    accessToken ? [url, accessToken] : url,
    accessToken
      ? ([requestUrl, token]) => fetchDataWithAuth(requestUrl, token)
      : (requestUrl) => fetchData(requestUrl),
    { suspense: true },
  );

  return {
    data: response?.tags ?? [],
  };
};

export default useTagOptions;
