import { useState } from "react";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

import { getLoginUrl } from "../auth";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

const DiscordLoginButton = () => {
  const [isLoginRequesting, setIsLoginRequesting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoginRequesting(true);
    setLoginError(null);

    try {
      const url = new URL(await getLoginUrl());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid login URL");
      }
      window.location.assign(url.toString());
    } catch {
      setLoginError(
        "ログインを開始できませんでした。時間をおいて再試行してください。",
      );
      setIsLoginRequesting(false);
    }
  };

  return (
    <div className={styles["login-control"]}>
      <Button
        variant="primary"
        onClick={handleLogin}
        isDisabled={isLoginRequesting}
      >
        <span className={styles["login-content"]}>
          <span>
            {isLoginRequesting ? "ログイン画面へ移動中..." : "ログイン"}
          </span>
          <LoginRoundedIcon />
        </span>
      </Button>
      {loginError && (
        <p className={styles["login-error"]} role="alert">
          {loginError}
        </p>
      )}
    </div>
  );
};

export default DiscordLoginButton;
