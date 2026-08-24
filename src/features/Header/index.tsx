import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

import { getLoginUrl, logout } from "../auth/auth";
import { useAuthStore } from "../auth/store/useAuthStore";
import { useUserStore } from "../auth/store/useUserStore";
import AccountMenu from "./AccountMenu";
import { getUserData } from "./api/getUserData";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import useToast from "@/shared/ui/Toast/hook/useToast";

const Header = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async () => {
    const url = await getLoginUrl();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
      return;
    }

    navigate(url);
  };
  const { accessToken } = useAuthStore();
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (!accessToken) {
      clearUser();
      return;
    }

    let isActive = true;
    const fetchUserData = async () => {
      const data = await getUserData(accessToken);
      if (isActive) {
        setUser(data);
      }
    };

    fetchUserData().catch((error) => {
      console.error("Error fetching user data:", error);
    });

    return () => {
      isActive = false;
    };
  }, [accessToken, clearUser, setUser]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast({ message: "ログアウトしました", severity: "success" });
    } catch {
      showToast({
        message: "サーバー側のセッションを無効化できませんでした",
        severity: "error",
      });
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <header className={styles["header-wrapper"]}>
      <div className={styles["logo-wrapper"]}>
        <Link to="/">
          <img src="/ToyboxLogo.svg" alt="logo-image" height={75} />
        </Link>
      </div>
      <div className={styles["login-wrapper"]}>
        {accessToken && (
          <Button variant="primary" onClick={() => navigate("/edit/new")}>
            <div className={styles["login-container"]}>
              <p>新規投稿する</p>
              <AutoAwesomeRoundedIcon />
            </div>
          </Button>
        )}
        {user ? (
          <AccountMenu user={user} onLogout={handleLogout} />
        ) : (
          <Button variant="primary" onClick={handleLogin}>
            <div className={styles["login-container"]}>
              <LoginRoundedIcon />
            </div>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
