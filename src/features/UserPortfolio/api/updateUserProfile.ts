import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ApiError, patchDataWithAuth } from "@/util/fetchData";

import type { UserProfileData } from "./getUserProfile";

type UpdateUserProfileParams = {
  displayName: string;
  profile: string;
  xUsername: string;
  githubUsername: string;
  avatar?: File | null;
  accessToken: string;
};

const MAX_PROFILE_REQUEST_SIZE = 5 * 1024 * 1024;

export const updateUserProfile = async ({
  displayName,
  profile,
  xUsername,
  githubUsername: githubID,
  avatar,
  accessToken,
}: UpdateUserProfileParams): Promise<UserProfileData> => {
  const { sessionVersion } = useAuthStore.getState();
  const data = new FormData();
  data.set("display_name", displayName);
  data.set("profile", profile);
  data.set("x_username", xUsername);
  data.set("github_id", githubID);
  if (avatar) data.set("avatar", avatar);

  // 画像以外のフィールドと multipart の境界も上限に含める。
  const body = await new Response(data).blob();
  if (body.size > MAX_PROFILE_REQUEST_SIZE) throw new ApiError(413);
  if (sessionVersion !== useAuthStore.getState().sessionVersion) {
    throw new ApiError(401);
  }

  return patchDataWithAuth("/auth/users", data, accessToken);
};
