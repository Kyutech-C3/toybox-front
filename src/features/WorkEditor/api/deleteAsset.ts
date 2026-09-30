import { deleteDataWithAuth } from "@/util/fetchData";

const deleteAsset = async (
  assetID: string,
  accessToken: string,
): Promise<void> => {
  await deleteDataWithAuth(`/auth/works/asset/${assetID}`, accessToken);
};

export { deleteAsset };
