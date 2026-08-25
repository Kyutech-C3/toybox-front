import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Comment } from "@/shared/types/comment";

interface UseCommentParams {
  workId: string;
}

interface UseCommentReturn {
  data: Comment[];
}

const useComment = ({ workId }: UseCommentParams): UseCommentReturn => {
  const url = `/works/${workId}/comments`;

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
