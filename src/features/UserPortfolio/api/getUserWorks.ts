import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { WorkListResponse } from "@/shared/types/work";

type GetUserWorksParams = {
  userID: string;
  page: number;
  limit: number;
  isAuthenticated: boolean;
};

export const getUserWorks = async ({
  userID,
  page,
  limit,
  isAuthenticated,
}: GetUserWorksParams): Promise<WorkListResponse> => {
  const path = `/works/users/${userID}?page=${page}&limit=${limit}`;

  return isAuthenticated ? fetchDataWithAuth(path) : fetchData(path);
};
