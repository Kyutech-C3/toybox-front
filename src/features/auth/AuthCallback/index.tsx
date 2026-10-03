import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authenticateWithCode, removeLegacyAuthStorage } from "../auth";
import { consumeLoginCallback } from "../loginCallback";
import { useAuthStore } from "../store/useAuthStore";

import PageLoading from "@/shared/ui/PageLoading";
import useToast from "@/shared/ui/Toast/hook/useToast";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const requestRef = useRef<Promise<boolean> | null>(null);
  const returnToRef = useRef("/");

  useEffect(() => {
    if (!requestRef.current) {
      removeLegacyAuthStorage();
      const callback = consumeLoginCallback(location.pathname, location.search);
      returnToRef.current = callback?.returnTo ?? "/";
      requestRef.current = callback?.code
        ? authenticateWithCode(callback.code).then(
            () => true,
            () => false,
          )
        : Promise.resolve(false);
    }

    let isActive = true;
    requestRef.current.then((isSuccessful) => {
      if (!isActive) return;
      showToast({
        message: isSuccessful ? "ログインしました" : "ログインに失敗しました",
        severity: isSuccessful ? "success" : "error",
      });
      if (isSuccessful || useAuthStore.getState().accessToken) {
        useAuthStore.getState().setInitialized();
      }
      // 失敗時のCookieからの復元は、戻り先のProviderに任せる。
      navigate(returnToRef.current, { replace: true });
    });
    return () => {
      isActive = false;
    };
  }, [location.pathname, location.search, navigate, showToast]);

  return <PageLoading />;
};

export default AuthCallback;
