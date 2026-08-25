import useSWR from "swr";

import { getUserProfile } from "../api/getUserProfile";
import { getUserWorks } from "../api/getUserWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Work } from "@/shared/types/work";
import type { UserProfileData } from "../api/getUserProfile";

type UseUserPortfolioParams = {
  userID: string;
};

type UseUserPortfolioReturn = {
  userProfile: UserProfileData;
  works: Work[];
  isOwner: boolean;
};

type GetUserPortfolioSWRKeyParams = {
  userID: string;
  accessToken: string | null;
};

export const getUserPortfolioSWRKey = ({
  userID,
  accessToken,
}: GetUserPortfolioSWRKeyParams) =>
  [`/users/${userID}`, `/works/users/${userID}`, accessToken] as const;

const useUserPortfolio = ({
  userID,
}: UseUserPortfolioParams): UseUserPortfolioReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.user);
  const isOwner = Boolean(accessToken && currentUser?.id === userID);
  const swrKey = getUserPortfolioSWRKey({ userID, accessToken });

  const { data } = useSWR(
    swrKey,
    async () => {
      const [userProfile, worksResponse] = await Promise.all([
        getUserProfile(userID),
        getUserWorks({
          userID,
          accessToken: accessToken ?? undefined,
        }),
      ]);

      return { userProfile, worksResponse };
    },
    { suspense: true },
  );

  if (!data) {
    throw new Error("User portfolio response is empty");
  }

  const visibleWorks = (data.worksResponse.works ?? []).filter((work) => {
    if (work.visibility === "public") {
      return true;
    }
    if (work.visibility === "private") {
      return Boolean(accessToken);
    }
    return isOwner;
  });

  return {
    userProfile: data.userProfile,
    works: visibleWorks,
    isOwner,
  };
};

export default useUserPortfolio;
