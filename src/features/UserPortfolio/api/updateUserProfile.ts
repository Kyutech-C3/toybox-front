import { putDataWithAuth } from "@/util/fetchData";

import type { UserProfileData } from "./getUserProfile";

type UpdateUserProfileParams = {
  userProfile: UserProfileData;
  displayName: string;
  profile: string;
  twitterID: string;
  githubID: string;
  accessToken: string;
};

export const updateUserProfile = async ({
  userProfile,
  displayName,
  profile,
  twitterID,
  githubID,
  accessToken,
}: UpdateUserProfileParams): Promise<UserProfileData> =>
  putDataWithAuth(
    "/auth/users",
    JSON.stringify({
      display_name: displayName,
      profile,
      email: userProfile.email,
      twitter_id: twitterID,
      github_id: githubID,
    }),
    accessToken,
  );
