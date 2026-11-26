import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

interface UseWorkDetailParams {
  id: string;
}

interface UseWorkDetailReturn {
  data: Work | undefined;
}

export const getWorkDetailSWRKey = (id: string, isAuthenticated: boolean) => {
  const url = `/works/${id}`;
  return isAuthenticated ? ([url, true] as const) : url;
};

const useWorkDetail = ({ id }: UseWorkDetailParams): UseWorkDetailReturn => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: response } = useSWR<Work>(
    getWorkDetailSWRKey(id, isAuthenticated),
    () =>
      isAuthenticated
        ? fetchDataWithAuth(`/works/${id}`)
        : fetchData(`/works/${id}`),
    { suspense: true },
  );

  return {
    data: response,
  };
};

export default useWorkDetail;
