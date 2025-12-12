import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Comment } from "@/shared/types/comment";

interface UseCommentOptionsReturn {
  data: Comment[];
  error: Error | undefined;
}

const useComment = (workID: string): UseCommentOptionsReturn => {
  const url = `/works/${workID}/comments`;

  const fetcher = async (url: string): Promise<Comment[]> => {
    const response = await fetchData(url);
    return response;
  };

  const { data: response, error } = useSWR<Comment[]>(url, fetcher, {
    suspense: true,
  });

  console.log("Comments fetched:", response);

  return {
    data: response ?? [],
    error: error,
  };
};

export default useComment;
