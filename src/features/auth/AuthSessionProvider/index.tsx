import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AuthRefreshError,
  authenticateWithCode,
  refreshAccessToken,
  removeLegacyAuthStorage,
} from "../auth";
import { consumeLoginCallback } from "../loginCallback";
import { useAuthStore } from "../store/useAuthStore";

import PageErrorState from "@/shared/ui/PageErrorState";
import PageLoading from "@/shared/ui/PageLoading";
import useToast from "@/shared/ui/Toast/hook/useToast";

import type { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitializingRef = useRef(false);
  const [hasRestoreFailed, setHasRestoreFailed] = useState(false);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const { showToast } = useToast();

  const initializeAuthSession = useCallback(() => {
    if (isInitialized || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setHasRestoreFailed(false);
    removeLegacyAuthStorage();

    const loginCallback = consumeLoginCallback(
      location.pathname,
      location.search,
    );
    const initializeSession = loginCallback
      ? authenticateWithCode(loginCallback.code)
          .then((token) => {
            showToast({ message: "ログインしました", severity: "success" });
            return token;
          })
          .catch(() => {
            showToast({ message: "ログインに失敗しました", severity: "error" });
            // ログイン試行の失敗は既存セッションの失効とは別に扱う。
            return useAuthStore.getState().accessToken ?? refreshAccessToken();
          })
      : refreshAccessToken();

    initializeSession
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
        if (loginCallback) {
          navigate("/", { replace: true });
        }
        isInitializingRef.current = false;
      });
  }, [
    isInitialized,
    location.pathname,
    location.search,
    navigate,
    setInitialized,
    showToast,
  ]);

  useEffect(() => {
    initializeAuthSession();
  }, [initializeAuthSession]);

  const handleRetry = () => {
    initializeAuthSession();
  };

  if (!isInitialized) {
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
