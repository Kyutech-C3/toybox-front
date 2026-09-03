import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
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
  const { user, setUser, setUserLoadFailed, clearUser } = useUserStore();

  useEffect(() => {
    if (!accessToken) {
      clearUser();
      return;
    }

    let isActive = true;
    const fetchUserData = async () => {
      const data = await getUserData(accessToken);
      if (!isActive) return;
      if (data) setUser(data);
      else setUserLoadFailed();
    };

    fetchUserData().catch((error) => {
      console.error("Error fetching user data:", error);
      if (isActive) setUserLoadFailed();
    });

    return () => {
      isActive = false;
    };
  }, [accessToken, clearUser, setUser, setUserLoadFailed]);

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
          <img
            src="/ToyboxLogo.svg"
            alt="logo-image"
            className={styles["logo-image"]}
            height={44}
          />
        </Link>
      </div>
      <div className={styles["login-wrapper"]}>
        {user ? (
          <AccountMenu user={user} onLogout={handleLogout} />
        ) : (
          <Button variant="primary" onClick={handleLogin} ariaLabel="ログイン">
            <span className={styles["login-container"]}>
              <LoginRoundedIcon fontSize="small" />
              ログイン
            </span>
          </Button>
        )}
        {accessToken && (
          <div className={styles["new-work-button"]}>
            <Button
              variant="primary"
              onClick={() => navigate("/edit/new")}
              ariaLabel="投稿"
            >
              <span className={styles["login-container"]}>
                <span className={styles["new-work-icon"]} aria-hidden="true">
                  <AddRoundedIcon fontSize="inherit" />
                </span>
                <span className={styles["new-work-label"]}>投稿</span>
              </span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
