import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";

import useToast from "@/shared/ui/Toast/hook/useToast";

import type { ReactNode } from "react";

type AuthCallbackProviderProps = {
  children: ReactNode;
};

const AuthCallbackProvider = ({ children }: AuthCallbackProviderProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHandlingCodeRef = useRef(false);
  const { accessToken, getAccessToken } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code || accessToken || isHandlingCodeRef.current) {
      return;
    }

    isHandlingCodeRef.current = true;
    getAccessToken(code)
      .then(() => {
        showToast({ message: "ログインしました", severity: "success" });
        navigate("/", { replace: true });
      })
      .catch((error) => {
        console.error("Error during login:", error);
        showToast({ message: "ログインに失敗しました", severity: "error" });
        navigate("/", { replace: true });
      });
  }, [searchParams, accessToken, getAccessToken, navigate, showToast]);

  return children;
};

export default AuthCallbackProvider;
