import useSWR from "swr";

import { getUserProfile } from "../api/getUserProfile";
import { getUserWorks } from "../api/getUserWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Work, WorkListResponse } from "@/shared/types/work";
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
  isAuthenticated: boolean;
  page: number;
};

export type UserPortfolioSWRKey = readonly [string, string, boolean];

export type UserPortfolioData = {
  userProfile: UserProfileData;
  worksResponse: WorkListResponse;
};

export const USER_WORKS_PAGE_SIZE = 30;

export const getUserPortfolioSWRKey = ({
  userID,
  isAuthenticated,
  page,
}: GetUserPortfolioSWRKeyParams): UserPortfolioSWRKey =>
  [
    `/users/${userID}`,
    `/works/users/${userID}?page=${page}&limit=${USER_WORKS_PAGE_SIZE}`,
    isAuthenticated,
  ] as const;

const useUserPortfolio = ({
  userID,
  page,
}: UseUserPortfolioParams): UseUserPortfolioReturn => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useUserStore((state) => state.user);
  const isOwner = isAuthenticated && currentUser?.id === userID;
  const swrKey = getUserPortfolioSWRKey({
    userID,
    isAuthenticated,
    page,
  });

  const { data } = useSWR<UserPortfolioData>(
    swrKey,
    async () => {
      const [userProfile, worksResponse] = await Promise.all([
        getUserProfile(userID),
        getUserWorks({
          userID,
          page,
          limit: USER_WORKS_PAGE_SIZE,
          isAuthenticated,
        }),
      ]);

      return { userProfile, worksResponse };
    },
    { suspense: true },
  );

  if (!data) {
    throw new Error("User portfolio response is empty");
  }

  return {
    userProfile: data.userProfile,
    works: data.worksResponse.works ?? [],
    totalCount: data.worksResponse.total_count,
    isOwner,
    swrKey,
  };
};

export default useUserPortfolio;
