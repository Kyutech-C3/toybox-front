import { useEffect } from "react";

import { getCurrentUser } from "../api/getCurrentUser";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";

import type { UserProfile } from "../types";

type UseCurrentUserReturn = {
  user: UserProfile | null;
};

const useCurrentUser = (): UseCurrentUserReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (!accessToken) {
      clearUser();
      return;
    }

    let isCancelled = false;

    getCurrentUser(accessToken)
      .then((currentUser) => {
        if (!isCancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          clearUser();
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, clearUser, setUser]);

  return { user };
};

export default useCurrentUser;
