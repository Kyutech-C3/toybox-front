import { fetchData, postDataWithCredentials } from "@/util/fetchData";

const getLoginUrl = async () => {
  const response = await fetchData("/auth/discord");
  return response.url;
};

type RefreshAccessTokenResponse = {
  access_token: string;
};

const refreshAccessToken = async (): Promise<string> => {
  const response =
    await postDataWithCredentials<RefreshAccessTokenResponse>("/auth/refresh");

  if (!response.access_token) {
    throw new Error("Failed to refresh access token");
  }

  return response.access_token;
};

export { getLoginUrl, refreshAccessToken };
