import { putDataWithAuth } from "@/util/fetchData";

import type { UserProfileData } from "./getUserProfile";

type UpdateUserProfileParams = {
  userProfile: UserProfileData;
  displayName: string;
  profile: string;
  accessToken: string;
};

export const updateUserProfile = async ({
  userProfile,
  displayName,
  profile,
  accessToken,
}: UpdateUserProfileParams): Promise<UserProfileData> =>
  putDataWithAuth(
    "/auth/users",
    JSON.stringify({
      display_name: displayName,
      profile,
      email: userProfile.email,
      twitter_id: userProfile.twitter_id,
      github_id: userProfile.github_id,
    }),
    accessToken,
  );
