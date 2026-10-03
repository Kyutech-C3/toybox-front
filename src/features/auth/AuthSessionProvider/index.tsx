import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  AuthRefreshError,
  refreshAccessToken,
  removeLegacyAuthStorage,
} from "../auth";
import { useAuthStore } from "../store/useAuthStore";

import PageErrorState from "@/shared/ui/PageErrorState";
import PageLoading from "@/shared/ui/PageLoading";

import type { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  const location = useLocation();
  const isCallbackPage = location.pathname === "/auth/callback";
  const isInitializingRef = useRef(false);
  const [hasRestoreFailed, setHasRestoreFailed] = useState(false);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const initializeAuthSession = useCallback(() => {
    if (isCallbackPage || isInitialized || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setHasRestoreFailed(false);
    removeLegacyAuthStorage();

    refreshAccessToken()
      .then(() => {
        setInitialized();
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRefreshError && error.isSessionInvalid) {
          setInitialized();
        } else {
          setHasRestoreFailed(true);
        }
      })
      .finally(() => {
        isInitializingRef.current = false;
      });
  }, [isInitialized, isCallbackPage, setInitialized]);

  useEffect(() => {
    initializeAuthSession();
  }, [initializeAuthSession]);

  const handleRetry = () => {
    initializeAuthSession();
  };

  if (!isCallbackPage && !isInitialized) {
    if (hasRestoreFailed) {
      return (
        <PageErrorState
          title="ログイン状態を確認できませんでした"
          description="通信環境を確認して、もう一度お試しください。"
          actions={[
            {
              id: "retry",
              label: "再試行",
              type: "button",
              onClick: handleRetry,
            },
          ]}
        />
      );
    }
    return <PageLoading />;
  }

  return children;
};

export default AuthSessionProvider;
