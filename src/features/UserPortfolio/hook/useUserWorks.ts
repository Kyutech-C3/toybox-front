import useSWR from "swr";

import { getUserWorks } from "../api/getUserWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Work } from "@/shared/types/work";

type UseUserWorksParams = {
  userID: string;
};

type UseUserWorksReturn = {
  data: Work[];
  isOwner: boolean;
};

const useUserWorks = ({ userID }: UseUserWorksParams): UseUserWorksReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.user);
  const isOwner = Boolean(accessToken && currentUser?.id === userID);

  const { data: response } = useSWR(
    [`/works/users/${userID}`, accessToken],
    () =>
      getUserWorks({
        userID,
        accessToken: accessToken ?? undefined,
      }),
    { suspense: true },
  );

  const works = response?.works ?? [];
  const visibleWorks = works.filter((work) => {
    if (work.visibility === "public") {
      return true;
    }
    if (work.visibility === "private") {
      return Boolean(accessToken);
    }
    return isOwner;
  });

  return {
    data: visibleWorks,
    isOwner,
  };
};

export default useUserWorks;
