import { postDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const postWork = async (data: WorkRequestData, accessToken: string) => {
  try {
    const response = await postDataWithAuth(
      "/auth/works",
      JSON.stringify(data),
      accessToken,
    );
    return response;
  } catch (error) {
    console.error("Error posting work:", error);
    return null;
  }
};

export { postWork };
