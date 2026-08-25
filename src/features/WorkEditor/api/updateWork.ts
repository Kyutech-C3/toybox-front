import { patchDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

/**
 * 作品を更新する。所有者以外の更新はサーバー側で拒否される。
 * エラーは握りつぶさず呼び出し側へ投げる。
 */
const updateWork = async (
  workID: string,
  data: WorkRequestData,
  accessToken: string,
) =>
  patchDataWithAuth(`/auth/works/${workID}`, JSON.stringify(data), accessToken);

export { updateWork };
