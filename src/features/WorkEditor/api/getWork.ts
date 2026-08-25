import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

const getWork = async (workID: string, accessToken?: string): Promise<Work> => {
  const path = `/works/${workID}`;
  return accessToken ? fetchDataWithAuth(path, accessToken) : fetchData(path);
};

export { getWork };
