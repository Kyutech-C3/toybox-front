import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getLoginUrl } from "../auth";
import { useAuthStore } from "../store/useAuthStore";

import PageErrorState from "@/shared/ui/PageErrorState";

import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>();

  const handleLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError(undefined);
    try {
      const url = await getLoginUrl();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }

      navigate(url);
    } catch {
      setLoginError(
        "ログイン画面を開けませんでした。通信環境を確認して再試行してください。",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!accessToken) {
    return (
      <PageErrorState
        title="ログインが必要です"
        description={
          loginError ?? "作品を投稿・編集するにはログインしてください。"
        }
        actions={[
          {
            id: "login",
            label: isLoggingIn
              ? "ログイン画面を開いています..."
              : "ログインする",
            onClick: () => void handleLogin(),
            isDisabled: isLoggingIn,
            type: "button",
          },
          {
            id: "home",
            label: "トップへ戻る",
            to: "/",
            type: "link",
          },
        ]}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
