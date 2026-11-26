import useSWR from "swr";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Comment } from "@/shared/types/comment";

interface UseCommentParams {
  workId: string;
}

interface UseCommentReturn {
  data: Comment[];
}

export const getCommentSWRKey = (workId: string, isAuthenticated: boolean) => {
  const url = `/works/${workId}/comments`;
  return isAuthenticated ? ([url, true] as const) : url;
};

const useComment = ({ workId }: UseCommentParams): UseCommentReturn => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: response } = useSWR<Comment[]>(
    getCommentSWRKey(workId, isAuthenticated),
    () =>
      isAuthenticated
        ? fetchDataWithAuth(`/works/${workId}/comments`)
        : fetchData(`/works/${workId}/comments`),
    { suspense: true },
  );

  return {
    data: response ?? [],
  };
};

export default useComment;
