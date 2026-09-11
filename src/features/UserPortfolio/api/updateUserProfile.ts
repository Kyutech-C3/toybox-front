import { patchDataWithAuth } from "@/util/fetchData";

import type { UserProfileData } from "./getUserProfile";

type UpdateUserProfileParams = {
  displayName: string;
  profile: string;
  xUsername: string;
  githubUsername: string;
  accessToken: string;
};

export const updateUserProfile = async ({
  displayName,
  profile,
  xUsername,
  githubUsername: githubID,
  accessToken,
}: UpdateUserProfileParams): Promise<UserProfileData> =>
  patchDataWithAuth(
    "/auth/users",
    JSON.stringify({
      display_name: displayName,
      profile,
      twitter_id: xUsername,
      github_id: githubID,
    }),
    accessToken,
  );
