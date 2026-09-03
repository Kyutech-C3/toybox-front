import {
  deleteDataWithAuth,
  fetchData,
  fetchDataWithAuth,
  postDataWithAuthNoContent,
} from "@/util/fetchData";

export type FavoriteCountResponse = {
  total: number;
};

export type FavoriteStatusResponse = {
  isFavorite: boolean;
};

export const getFavoriteCount = async (
  workID: string,
): Promise<FavoriteCountResponse> => fetchData(`/works/${workID}/favorite`);

export const getFavoriteStatus = async (
  workID: string,
  accessToken: string,
): Promise<FavoriteStatusResponse> => {
  const response: Record<"is_favorite", boolean> = await fetchDataWithAuth(
    `/auth/works/${workID}/favorite/is-favorite`,
    accessToken,
  );
  return { isFavorite: response.is_favorite };
};

export const createFavorite = async (
  workID: string,
  accessToken: string,
): Promise<void> =>
  postDataWithAuthNoContent(`/auth/works/${workID}/favorite`, accessToken);

export const deleteFavorite = async (
  workID: string,
  accessToken: string,
): Promise<void> =>
  deleteDataWithAuth(`/auth/works/${workID}/favorite`, accessToken);
