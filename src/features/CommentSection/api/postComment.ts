import { postDataWithAuth } from "@/util/fetchData";

const postComment = async (
  workID: string,
  content: string,
  accessToken: string,
  replyAt?: string,
) => {
  const response = await postDataWithAuth(
    `/works/${workID}/comments`,
    JSON.stringify({
      content,
      replyAt,
    }),
    accessToken,
  );

  return response;
};

export default postComment;
