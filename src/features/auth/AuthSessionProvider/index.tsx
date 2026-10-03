import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AuthRefreshError,
  authenticateWithCode,
  refreshAccessToken,
  removeLegacyAuthStorage,
} from "../auth";
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

    const searchParams = new URLSearchParams(location.search);
    const callbackCode = searchParams.get("code");
    const initializeSession = callbackCode
      ? authenticateWithCode(callbackCode)
      : refreshAccessToken();

    initializeSession
      .then(() => {
        setInitialized();
        if (callbackCode) {
          showToast({ message: "ログインしました", severity: "success" });
        }
      })
      .catch((error: unknown) => {
        if (callbackCode) {
          showToast({ message: "ログインに失敗しました", severity: "error" });
          setInitialized();
        } else if (
          error instanceof AuthRefreshError &&
          error.isSessionInvalid
        ) {
          setInitialized();
        } else {
          setHasRestoreFailed(true);
        }
      })
      .finally(() => {
        if (callbackCode) {
          navigate("/", { replace: true });
        }
        isInitializingRef.current = false;
      });
  }, [isInitialized, location.search, navigate, setInitialized, showToast]);

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
