import { postDataWithAuth } from "@/util/fetchData";

type UploadAssetResponse = {
  id: string;
  url: string;
};

const uploadAsset = async (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append("asset", file);

  const response: UploadAssetResponse = await postDataWithAuth(
    "/auth/works/asset",
    formData,
    accessToken,
  );

  return response;
};

export { uploadAsset };
