import {
  fetchDataWithCredentials,
  postDataWithCredentials,
} from "@/util/fetchData";

type GetLoginUrlResponse = {
  url: string;
};

const getLoginUrl = async (): Promise<string> => {
  const response =
    await fetchDataWithCredentials<GetLoginUrlResponse>("/auth/discord");

  if (!response.url) {
    throw new Error("Failed to get login URL");
  }

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
