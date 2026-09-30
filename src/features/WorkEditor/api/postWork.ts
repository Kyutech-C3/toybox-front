import { postDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const postWork = async (data: WorkRequestData, accessToken: string) =>
  postDataWithAuth("/auth/works", JSON.stringify(data), accessToken);

export { postWork };
