import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  AuthRefreshError,
  getLoginUrl,
  logout,
  refreshAccessToken,
} from "../auth/auth";
import { useAuthStore } from "../auth/store/useAuthStore";
import { useUserStore } from "../auth/store/useUserStore";
import AccountMenu from "./AccountMenu";
import { getUserData } from "./api/getUserData";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import FloatingActionButton from "@/shared/ui/FloatingActionButton";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { getCurrentTheme, setTheme, subscribeTheme } from "@/util/theme";

const Header = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRetryingSession, setIsRetryingSession] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const isEditingWork = pathname.startsWith("/edit/");
  const { showToast } = useToast();
  const theme = useSyncExternalStore(subscribeTheme, getCurrentTheme);

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const url = await getLoginUrl(
        location.pathname + location.search + location.hash,
      );

      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }

      navigate(url);
    } catch {
      showToast({
        message: "ログイン画面を開けませんでした",
        severity: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  const { accessToken, hasRestoreFailed } = useAuthStore();
  const { user, hasLoadFailed, setUser, setUserLoadFailed, clearUser } =
    useUserStore();

  const handleRetrySession = async () => {
    if (isRetryingSession) return;
    setIsRetryingSession(true);
    try {
      await refreshAccessToken();
      showToast({ message: "ログイン状態を確認しました", severity: "success" });
    } catch (error) {
      if (error instanceof AuthRefreshError && error.isSessionInvalid) {
        showToast({ message: "ログインしていません", severity: "info" });
      } else {
        showToast({
          message: "ログイン状態を確認できませんでした。再試行してください。",
          severity: "error",
        });
      }
    } finally {
      setIsRetryingSession(false);
    }
  };

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
        <Button
          variant="ghost"
          isIconOnly
          className={styles["header-icon-button"]}
          onClick={handleThemeToggle}
          aria-label={
            theme === "light"
              ? "ダークモードに切り替え"
              : "ライトモードに切り替え"
          }
          icon={
            theme === "light" ? (
              <DarkModeRoundedIcon />
            ) : (
              <LightModeRoundedIcon />
            )
          }
        />
        {user ? (
          <AccountMenu user={user} onLogout={handleLogout} />
        ) : (
          <Button
            variant="primary"
            className={styles["login-button"]}
            onClick={handleLogin}
            isDisabled={isRetryingSession}
            isLoading={isLoggingIn || (!!accessToken && !hasLoadFailed)}
            icon={<LoginRoundedIcon />}
            ariaLabel="ログイン"
          >
            <span className={styles["login-label"]}>ログイン</span>
          </Button>
        )}
        {hasRestoreFailed && (
          <Button
            variant="ghost"
            isIconOnly
            className={styles["header-icon-button"]}
            onClick={handleRetrySession}
            isLoading={isRetryingSession}
            isDisabled={isLoggingIn}
            ariaLabel="ログイン状態の確認を再試行"
            title="ログイン状態の確認を再試行"
            icon={
              isRetryingSession ? (
                <LoadingSpinner size="small" isDecorative />
              ) : (
                <RefreshRoundedIcon />
              )
            }
          />
        )}
        {accessToken && (
          <FloatingActionButton
            label="投稿"
            icon={<AddRoundedIcon fontSize="inherit" />}
            onClick={() => navigate("/edit/new")}
            isFloatingHidden={isEditingWork}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
