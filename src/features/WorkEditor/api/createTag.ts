import { postDataWithAuth } from "@/util/fetchData";

import type { Tag } from "@/shared/types/work";

const createTag = async (tag: string, accessToken: string): Promise<Tag> => {
  const response = await postDataWithAuth(
    "/auth/tags",
    JSON.stringify({ name: tag }),
    accessToken,
  );

  if (!response.id) {
    throw new Error("Failed to create tag");
  }
  return response;
};

export { createTag };
