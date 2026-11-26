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

/** @apiContract */
type FavoriteStatusApiResponse = {
  is_favorite: boolean;
};

export const getFavoriteCount = async (
  workID: string,
): Promise<FavoriteCountResponse> => fetchData(`/works/${workID}/favorite`);

export const getFavoriteStatus = async (
  workID: string,
): Promise<FavoriteStatusResponse> => {
  const response: FavoriteStatusApiResponse = await fetchDataWithAuth(
    `/auth/works/${workID}/favorite/is-favorite`,
  );
  return { isFavorite: response.is_favorite };
};

export const createFavorite = async (workID: string): Promise<void> =>
  postDataWithAuthNoContent(`/auth/works/${workID}/favorite`);

export const deleteFavorite = async (workID: string): Promise<void> =>
  deleteDataWithAuth(`/auth/works/${workID}/favorite`);
