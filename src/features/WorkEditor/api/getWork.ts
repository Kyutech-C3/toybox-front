import { fetchData, fetchDataWithAuth } from "@/util/fetchData";

import type { Work } from "@/shared/types/work";

/**
 * 作品を 1 件取得する。
 * 現状 GET /works/{work_id} は認証不要だが、
 * 下書き・限定公開の取得に認証が必要になっても動くようトークンがあれば付与する。
 */
const getWork = async (workID: string, accessToken?: string): Promise<Work> => {
  const path = `/works/${workID}`;
  return accessToken ? fetchDataWithAuth(path, accessToken) : fetchData(path);
};

export { getWork };
