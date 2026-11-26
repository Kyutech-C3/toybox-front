import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { TagDetail, TagListResponse } from "@/shared/types/work";

interface UseTagOptionsReturn {
  data: TagDetail[];
}

const TAGS_URL = "/tags";

export const getTagOptionsSWRKey = (isAuthenticated: boolean) =>
  isAuthenticated ? ([TAGS_URL, true] as const) : TAGS_URL;

const useTagOptions = (): UseTagOptionsReturn => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: response } = useSWR<TagListResponse>(
    getTagOptionsSWRKey(isAuthenticated),
    () => (isAuthenticated ? fetchDataWithAuth(TAGS_URL) : fetchData(TAGS_URL)),
    { suspense: true },
  );

  return {
    data: response?.tags ?? [],
  };
};

export default useTagOptions;
