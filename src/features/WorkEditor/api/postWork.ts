import { postDataWithAuth } from "@/util/fetchData";

import type { WorkRequestData } from "@/shared/types/work";

const postWork = async (data: WorkRequestData) =>
  postDataWithAuth("/auth/works", JSON.stringify(data));

export { postWork };
