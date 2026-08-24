import useSWR from "swr";

import { getUserWorks } from "../api/getUserWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Work } from "@/shared/types/work";
import type { ApiError } from "@/util/fetchData";

type UseUserWorksParams = {
  userID: string;
};

type UseUserWorksReturn = {
  data: Work[] | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  isOwner: boolean;
};

const useUserWorks = ({ userID }: UseUserWorksParams): UseUserWorksReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.user);
  const isOwner = Boolean(accessToken && currentUser?.id === userID);
  const ownerAccessToken = isOwner ? accessToken : null;

  const {
    data: response,
    error,
    isLoading,
  } = useSWR([`/works/users/${userID}`, ownerAccessToken], () =>
    getUserWorks({
      userID,
      accessToken: ownerAccessToken ?? undefined,
    }),
  );

  const works = response?.works ?? [];
  const visibleWorks = isOwner
    ? works
    : works.filter((work) => work.visibility === "public");

  return {
    data: response ? visibleWorks : undefined,
    error,
    isLoading,
    isOwner,
  };
};

export default useUserWorks;
