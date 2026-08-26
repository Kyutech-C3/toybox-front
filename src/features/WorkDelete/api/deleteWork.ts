import { deleteDataWithAuth } from "@/util/fetchData";

const deleteWork = async (workID: string, accessToken: string): Promise<void> =>
  deleteDataWithAuth(`/auth/works/${workID}`, accessToken);

export { deleteWork };
