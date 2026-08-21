import { fetchDataWithAuth } from "@/util/fetchData";

import type { UserProfile } from "../types";

const getCurrentUser = async (accessToken: string): Promise<UserProfile> => {
  return fetchDataWithAuth("/auth/users/me", accessToken);
};

export { getCurrentUser };
