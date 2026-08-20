import { useCallback, useEffect, useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Header from "@/features/Header";
import Button from "@/shared/ui/Button";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isSessionRestoring = useAuthStore((state) => state.isSessionRestoring);
  const [isSessionRestoreFailed, setIsSessionRestoreFailed] = useState(false);
  const authErrorTitleId = useId();
  const hasOAuthCallbackError = searchParams.has("error");
  const isAuthenticationFailed =
    hasOAuthCallbackError || isSessionRestoreFailed;

  const handleRestoreSession = useCallback(async () => {
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

    void handleRestoreSession();
  }, [handleRestoreSession, hasOAuthCallbackError]);

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        {isAuthenticationFailed ? (
          <section
            className={styles["auth-result"]}
            aria-labelledby={authErrorTitleId}
          >
            <h1 id={authErrorTitleId}>ログインを完了できませんでした</h1>
            <p>
              {hasOAuthCallbackError
                ? "Discord認証に失敗しました。もう一度ログインしてください。"
                : "認証情報を確認できませんでした。時間をおいて再試行してください。"}
            </p>
            <div className={styles["auth-actions"]}>
              {!hasOAuthCallbackError && (
                <Button
                  variant="primary"
                  onClick={handleRestoreSession}
                  isDisabled={isSessionRestoring}
                >
                  再試行
                </Button>
              )}
              <Link to="/">トップへ戻る</Link>
            </div>
          </section>
        ) : (
          <section className={styles["auth-result"]} aria-live="polite">
            <h1>ログインを確認しています</h1>
            <p>しばらくお待ちください。</p>
          </section>
        )}
      </main>
    </>
  );
};

export default AuthPage;
