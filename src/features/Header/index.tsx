import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

  const searchParams = useSearchParams();

  const handleLogin = async () => {
    const url = await getLoginUrl();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
      return;
    }

    navigate(url);
  };
  const { getAccessToken, accessToken } = useAuthStore();
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const code = searchParams[0].get("code");
    if (code && !accessToken) {
      getAccessToken(code)
        .then(() => {
          navigate("/");
        })
        .catch((error) => {
          console.error("Error during login:", error);
        });
    }
  }, [searchParams, accessToken, getAccessToken, navigate]);

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
          <Button variant="primary" onClick={handleLogin}>
            <div className={styles["login-container"]}>
              <p>ログイン</p>
              <LoginRoundedIcon />
            </div>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
