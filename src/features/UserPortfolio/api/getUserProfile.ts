import { fetchData } from "@/util/fetchData";

export type UserProfileData = {
  id: string;
  display_name: string;
  profile: string;
  avatar_url: string;
};

export const getUserProfile = async (
  userID: string,
): Promise<UserProfileData> => fetchData(`/users/${userID}`);
