import { postDataWithAuth } from "@/util/fetchData";

const postComment = async (
  workID: string,
  content: string,
  replyAt?: string,
) => {
  const response = await postDataWithAuth(
    `/works/${workID}/comments`,
    JSON.stringify({
      content: content,
      reply_at: replyAt,
    }),
  );

  return response;
};

export default postComment;
