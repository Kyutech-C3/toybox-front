import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { WorkListResponse } from "@/shared/types/work";

type GetUserWorksParams = {
  userID: string;
  page: number;
  limit: number;
  accessToken?: string;
};

export const getUserWorks = async ({
  userID,
  page,
  limit,
  accessToken,
}: GetUserWorksParams): Promise<WorkListResponse> => {
  const path = `/works/users/${userID}?page=${page}&limit=${limit}`;

  return accessToken ? fetchDataWithAuth(path, accessToken) : fetchData(path);
};
