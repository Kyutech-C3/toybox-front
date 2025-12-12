import { fetchData, postDataWithAuth } from "@/util/fetchData";

const getLoginUrl = async () => {
  const response = await fetchData("/auth/discord");
  return response.url;
};

const getAccessToken = async (code: string) => {
  const response = await fetchData(`/auth/discord/callback?code=${code}`);

  if (!response.access_token) {
    throw new Error("Failed to get access token");
  }

  return response.access_token;
};

const refreshAccessToken = async (accessToken: string) => {
  const response = await postDataWithAuth(
    "/auth/discord/refresh",
    JSON.stringify({}),
    accessToken,
  );

  if (!response.access_token) {
    throw new Error("Failed to refresh access token");
  }

  return response.access_token;
};

export { getLoginUrl, getAccessToken, refreshAccessToken };
