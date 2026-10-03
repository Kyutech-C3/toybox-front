import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  AuthRefreshError,
  refreshAccessToken,
  removeLegacyAuthStorage,
} from "../auth";
import { useAuthStore } from "../store/useAuthStore";

import PageLoading from "@/shared/ui/PageLoading";
import useToast from "@/shared/ui/Toast/hook/useToast";

import type { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  const location = useLocation();
  const isCallbackPage = location.pathname === "/auth/callback";
  const isInitializingRef = useRef(false);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setRestoreFailed = useAuthStore((state) => state.setRestoreFailed);
  const { showToast } = useToast();

  const initializeAuthSession = useCallback(() => {
    if (isCallbackPage || isInitialized || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setRestoreFailed(false);
    removeLegacyAuthStorage();

    refreshAccessToken()
      .catch((error: unknown) => {
        if (!(error instanceof AuthRefreshError && error.isSessionInvalid)) {
          setRestoreFailed(true);
          showToast({
            message: "ログイン状態を確認できませんでした。再試行してください。",
            severity: "error",
          });
        }
      })
      .finally(() => {
        isInitializingRef.current = false;
        setInitialized();
      });
  }, [
    isInitialized,
    isCallbackPage,
    setInitialized,
    setRestoreFailed,
    showToast,
  ]);

  useEffect(() => {
    initializeAuthSession();
  }, [initializeAuthSession]);

  if (!isCallbackPage && !isInitialized) {
    return <PageLoading />;
  }

  return children;
};

export default AuthSessionProvider;
