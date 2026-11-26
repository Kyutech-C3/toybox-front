import { deleteDataWithAuth } from "@/util/fetchData";

const deleteWork = async (workID: string): Promise<void> =>
  deleteDataWithAuth(`/auth/works/${workID}`);

export { deleteWork };
