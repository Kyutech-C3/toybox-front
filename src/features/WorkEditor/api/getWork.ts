import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

const getWork = async (
  workID: string,
  isAuthenticated: boolean,
): Promise<Work> => {
  const path = `/works/${workID}`;
  return isAuthenticated ? fetchDataWithAuth(path) : fetchData(path);
};

export { getWork };
