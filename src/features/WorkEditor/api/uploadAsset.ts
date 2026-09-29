import { postDataWithAuth } from "@/util/fetchData";

type UploadAssetResponse = {
  id: string;
  url: string;
};

const uploadAsset = async (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append("file", file.slice(0, file.size, file.type), file.name);

  const response: UploadAssetResponse = await postDataWithAuth(
    "/auth/works/asset",
    formData,
    accessToken,
  );

  return response;
};

export { uploadAsset };
