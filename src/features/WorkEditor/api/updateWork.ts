import { patchDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const updateWork = async (workID: string, data: Partial<WorkRequestData>) =>
  patchDataWithAuth(`/auth/works/${workID}`, JSON.stringify(data));

export { updateWork };
