import useSWR from "swr";

import { getUserProfile } from "../api/getUserProfile";

import type { ApiError } from "@/util/fetchData";
import type { UserProfileData } from "../api/getUserProfile";

type UseUserProfileParams = {
  userID: string;
};

type UseUserProfileReturn = {
  data: UserProfileData | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
};

const useUserProfile = ({
  userID,
}: UseUserProfileParams): UseUserProfileReturn => {
  const { data, error, isLoading } = useSWR<UserProfileData, ApiError>(
    `/users/${userID}`,
    () => getUserProfile(userID),
  );

  return { data, error, isLoading };
};

export default useUserProfile;
