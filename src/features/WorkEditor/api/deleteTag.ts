import { deleteDataWithAuth } from "@/util/fetchData";

const deleteTag = async (tagID: string): Promise<void> => {
  await deleteDataWithAuth(`/auth/tags/${tagID}`);
};

export { deleteTag };
