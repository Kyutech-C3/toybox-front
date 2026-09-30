import { deleteDataWithAuth } from "@/util/fetchData";

const deleteTag = async (tagID: string, accessToken: string): Promise<void> => {
  await deleteDataWithAuth(`/auth/tags/${tagID}`, accessToken);
};

export { deleteTag };
