import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

import { getLoginUrl } from "../auth/auth";
import { useAuthStore } from "../auth/store/useAuthStore";
import { getUserData } from "./api/getUserData";
import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";

const Header = () => {
  const navigate = useNavigate();

  const searchParams = useSearchParams();

  const handleLogin = async () => {
    const url = await getLoginUrl();
    navigate(url);
  };

  const { getAccessToken, accessToken } = useAuthStore();
  const [userData, setUserData] = useState<{
    display_name: string;
    icon_url: string;
  } | null>(null);

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
    const fetchUserData = async () => {
      if (accessToken) {
        const data = await getUserData(accessToken);
        setUserData(data);
      }
    };
    fetchUserData();
  }, [accessToken]);

  return (
    <header className={styles["header-wrapper"]}>
      <div className={styles["logo-wrapper"]}>
        <Link to="/">
          <img src="/logo.webp" alt="logo-image" height={75} />
        </Link>
      </div>
      <div className={styles["login-wrapper"]}>
        <Button variant="primary" onClick={() => navigate("/edit/new")}>
          <div className={styles["login-container"]}>
            <p>新規投稿する</p>
            <AutoAwesomeRoundedIcon />
          </div>
        </Button>
        {userData ? (
          <Avatar avatarURL={userData.icon_url} />
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
