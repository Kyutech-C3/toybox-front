import { useId } from "react";
import { Link } from "react-router-dom";

import useAuthCallback from "../hook/useAuthCallback";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

const AuthCallback = () => {
  const authErrorTitleId = useId();
  const {
    handleRetry,
    hasOAuthCallbackError,
    isAuthenticationFailed,
    isSessionRestoring,
  } = useAuthCallback();

  if (isAuthenticationFailed) {
    return (
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
              onClick={handleRetry}
              isDisabled={isSessionRestoring}
            >
              再試行
            </Button>
          )}
          <Link to="/">トップへ戻る</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles["auth-result"]} aria-live="polite">
      <h1>ログインを確認しています</h1>
      <p>しばらくお待ちください。</p>
    </section>
  );
};

export default AuthCallback;
