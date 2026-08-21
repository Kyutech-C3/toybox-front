import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";

import type { ReactNode } from "react";

const LEGACY_AUTH_STORAGE_KEY = "auth-storage";
const LEGACY_USER_STORAGE_KEY = "user-storage";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/auth") || accessToken) {
      return;
    }

    void restoreSession();
  }, [accessToken, location.pathname, restoreSession]);

  return children;
};

export default AuthSessionProvider;
