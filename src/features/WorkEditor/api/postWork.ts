import { postDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const postWork = async (data: WorkRequestData, accessToken: string) => {
  const response = await postDataWithAuth(
    "/auth/works",
    JSON.stringify(data),
    accessToken,
  );
  return response;
};

export { postWork };
