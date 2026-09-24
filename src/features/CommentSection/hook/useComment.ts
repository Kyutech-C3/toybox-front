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

export const getCommentSWRKey = (
  workId: string,
  accessToken: string | null,
) => {
  const url = `/works/${workId}/comments`;
  return accessToken ? ([url, accessToken] as const) : url;
};

const useComment = ({ workId }: UseCommentParams): UseCommentReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data: response } = useSWR<Comment[]>(
    getCommentSWRKey(workId, accessToken),
    () =>
      accessToken
        ? fetchDataWithAuth(`/works/${workId}/comments`, accessToken)
        : fetchData(`/works/${workId}/comments`),
    { suspense: true },
  );

  return {
    data: response ?? [],
  };
};

export default useComment;
