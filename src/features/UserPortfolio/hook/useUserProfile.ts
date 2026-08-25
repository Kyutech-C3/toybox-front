import useSWR from "swr";

import { getUserProfile } from "../api/getUserProfile";

import type { ApiError } from "@/util/fetchData";
import type { UserProfileData } from "../api/getUserProfile";

type UseUserProfileParams = {
  userID: string;
};

type UseUserProfileReturn = {
  data: UserProfileData;
};

const useUserProfile = ({
  userID,
}: UseUserProfileParams): UseUserProfileReturn => {
  const { data } = useSWR<UserProfileData, ApiError>(
    `/users/${userID}`,
    () => getUserProfile(userID),
    { suspense: true },
  );

  if (!data) {
    throw new Error("User profile response is empty");
  }

  return { data };
};

export default useUserProfile;
