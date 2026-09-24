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

export const getWorkDetailSWRKey = (id: string, accessToken: string | null) => {
  const url = `/works/${id}`;
  return accessToken ? ([url, accessToken] as const) : url;
};

const useWorkDetail = ({ id }: UseWorkDetailParams): UseWorkDetailReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data: response } = useSWR<Work>(
    getWorkDetailSWRKey(id, accessToken),
    () =>
      accessToken
        ? fetchDataWithAuth(`/works/${id}`, accessToken)
        : fetchData(`/works/${id}`),
    { suspense: true },
  );

  return {
    data: response,
  };
};

export default useWorkDetail;
