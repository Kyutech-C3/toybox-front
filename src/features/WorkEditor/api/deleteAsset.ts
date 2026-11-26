import { deleteDataWithAuth } from "@/util/fetchData";

const deleteAsset = async (assetID: string): Promise<void> => {
  await deleteDataWithAuth(`/auth/works/asset/${assetID}`);
};

export { deleteAsset };
