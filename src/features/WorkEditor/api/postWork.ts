import { postDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

/**
 * 作品を新規投稿する。
 * エラーは握りつぶさず呼び出し側へ投げる（updateWork と揃えている）。
 */
const postWork = async (data: WorkRequestData, accessToken: string) =>
  postDataWithAuth("/auth/works", JSON.stringify(data), accessToken);

export { postWork };
