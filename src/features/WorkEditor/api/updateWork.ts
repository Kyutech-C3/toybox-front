import { patchDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const updateWork = async (
  workID: string,
  data: WorkRequestData,
  accessToken: string,
) =>
  patchDataWithAuth(`/auth/works/${workID}`, JSON.stringify(data), accessToken);

export { updateWork };
