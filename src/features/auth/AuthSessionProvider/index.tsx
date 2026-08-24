import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  authenticateWithCode,
  refreshAccessToken,
  removeLegacyAuthStorage,
} from "../auth";
import { useAuthStore } from "../store/useAuthStore";

import useToast from "@/shared/ui/Toast/hook/useToast";

import type { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: AuthSessionProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitializingRef = useRef(false);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const { showToast } = useToast();

  useEffect(() => {
    if (isInitialized || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    removeLegacyAuthStorage();

    const searchParams = new URLSearchParams(location.search);
    const callbackCode = searchParams.get("code");
    const initializeSession = callbackCode
      ? authenticateWithCode(callbackCode)
      : refreshAccessToken();

    initializeSession
      .then(() => {
        if (callbackCode) {
          showToast({ message: "ログインしました", severity: "success" });
        }
      })
      .catch(() => {
        if (callbackCode) {
          showToast({ message: "ログインに失敗しました", severity: "error" });
        }
      })
      .finally(() => {
        if (callbackCode) {
          navigate("/", { replace: true });
        }
        setInitialized();
      });
  }, [isInitialized, location.search, navigate, setInitialized, showToast]);

  if (!isInitialized) {
    return null;
  }

  return children;
};

export default AuthSessionProvider;
