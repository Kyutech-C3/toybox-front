import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { WorkListResponse } from "@/shared/types/work";

type GetUserWorksParams = {
  userID: string;
  accessToken?: string;
};

export const getUserWorks = async ({
  userID,
  accessToken,
}: GetUserWorksParams): Promise<WorkListResponse> => {
  const path = `/works/users/${userID}`;

  return accessToken ? fetchDataWithAuth(path, accessToken) : fetchData(path);
};
