import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

import { getLoginUrl } from "../auth/auth";
import { useAuthStore } from "../auth/store/useAuthStore";
import { useUserStore } from "../auth/store/useUserStore";
import { getUserData } from "./api/getUserData";
import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";

const Header = () => {
  const navigate = useNavigate();
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
  const { accessToken } = useAuthStore();
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (!accessToken) {
      clearUser();
      return;
    }

    const fetchUserData = async () => {
      const data = await getUserData(accessToken);
      setUser(data);
    };

    fetchUserData().catch((error) => {
      console.error("Error fetching user data:", error);
    });
  }, [accessToken, clearUser, setUser]);

  return (
    <header className={styles["header-wrapper"]}>
      <div className={styles["logo-wrapper"]}>
        <Link to="/">
          <img src="/ToyboxLogo.svg" alt="logo-image" height={75} />
        </Link>
      </div>
      <div className={styles["login-wrapper"]}>
        <Button variant="primary" onClick={() => navigate("/edit/new")}>
          <div className={styles["login-container"]}>
            <p>新規投稿する</p>
            <AutoAwesomeRoundedIcon />
          </div>
        </Button>
        {user ? (
          <Avatar avatarURL={user.icon_url} />
        ) : (
          <Button
            variant="primary"
            onClick={handleLogin}
            isDisabled={isLoginRequesting}
          >
            <div className={styles["login-container"]}>
              <p>
                {isLoginRequesting ? "ログイン画面へ移動中..." : "ログイン"}
              </p>
              <LoginRoundedIcon />
            </div>
          </Button>
        )}
        {loginError && (
          <p className={styles["login-error"]} role="alert">
            {loginError}
          </p>
        )}
      </div>
    </header>
  );
};

export default Header;
