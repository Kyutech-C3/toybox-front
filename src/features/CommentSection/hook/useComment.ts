import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Comment } from "@/shared/types/comment";

interface UseCommentParams {
  workId: string;
}

interface UseCommentReturn {
  data: Comment[];
}

export const getCommentSWRKey = (workId: string) => `/works/${workId}/comments`;

const useComment = ({ workId }: UseCommentParams): UseCommentReturn => {
  const url = getCommentSWRKey(workId);

  const fetcher = async (url: string): Promise<Comment[]> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response } = useSWR<Comment[]>(url, fetcher, {
    suspense: true,
  });

  return {
    data: response ?? [],
  };
};

export default useComment;
