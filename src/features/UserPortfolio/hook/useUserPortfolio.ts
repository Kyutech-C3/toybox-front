import useSWR from "swr";

import { getUserProfile } from "../api/getUserProfile";
import { getUserWorks } from "../api/getUserWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Work } from "@/shared/types/work";
import type { UserProfileData } from "../api/getUserProfile";

type UseUserPortfolioParams = {
  userID: string;
  page: number;
};

type UseUserPortfolioReturn = {
  userProfile: UserProfileData;
  works: Work[];
  totalCount: number;
  isOwner: boolean;
  swrKey: UserPortfolioSWRKey;
};

type GetUserPortfolioSWRKeyParams = {
  userID: string;
  accessToken: string | null;
  page: number;
};

export type UserPortfolioSWRKey = readonly [string, string, string | null];

export const USER_WORKS_PAGE_SIZE = 30;

export const getUserPortfolioSWRKey = ({
  userID,
  accessToken,
  page,
}: GetUserPortfolioSWRKeyParams): UserPortfolioSWRKey =>
  [
    `/users/${userID}`,
    `/works/users/${userID}?page=${page}&limit=${USER_WORKS_PAGE_SIZE}`,
    accessToken,
  ] as const;

const useUserPortfolio = ({
  userID,
  page,
}: UseUserPortfolioParams): UseUserPortfolioReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.user);
  const isOwner = Boolean(accessToken && currentUser?.id === userID);
  const swrKey = getUserPortfolioSWRKey({
    userID,
    accessToken,
    page,
  });

  const { data } = useSWR(
    swrKey,
    async () => {
      const [userProfile, worksResponse] = await Promise.all([
        getUserProfile(userID),
        getUserWorks({
          userID,
          page,
          limit: USER_WORKS_PAGE_SIZE,
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
    totalCount: data.worksResponse.total_count,
    isOwner,
    swrKey,
  };
};

export default useUserPortfolio;
