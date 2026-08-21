import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";

type UseAuthCallbackReturn = {
  handleRetry: () => Promise<void>;
  hasOAuthCallbackError: boolean;
  isAuthenticationFailed: boolean;
  isSessionRestoring: boolean;
};

const useAuthCallback = (): UseAuthCallbackReturn => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isSessionRestoring = useAuthStore((state) => state.isSessionRestoring);
  const [isSessionRestoreFailed, setIsSessionRestoreFailed] = useState(false);
  const hasOAuthCallbackError = searchParams.has("error");
  const isAuthenticationFailed =
    hasOAuthCallbackError || isSessionRestoreFailed;

  const handleRetry = useCallback(async () => {
    setIsSessionRestoreFailed(false);
    const isSessionRestored = await restoreSession();

    if (isSessionRestored) {
      navigate("/", { replace: true });
      return;
    }

    setIsSessionRestoreFailed(true);
  }, [navigate, restoreSession]);

  useEffect(() => {
    if (hasOAuthCallbackError) {
      return;
    }

    void handleRetry();
  }, [handleRetry, hasOAuthCallbackError]);

  return {
    handleRetry,
    hasOAuthCallbackError,
    isAuthenticationFailed,
    isSessionRestoring,
  };
};

export default useAuthCallback;
