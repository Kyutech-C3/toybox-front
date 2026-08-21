import { Link, useNavigate } from "react-router-dom";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import styles from "./index.module.css";

import CurrentUserControl from "@/features/auth/CurrentUserControl";
import Button from "@/shared/ui/Button";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className={styles["header-wrapper"]}>
      <div className={styles["logo-wrapper"]}>
        <Link to="/">
          <img src="/ToyboxLogo.svg" alt="logo-image" height={75} />
        </Link>
      </div>
      <div className={styles["login-wrapper"]}>
        <Button variant="primary" onClick={() => navigate("/edit/new")}>
          <div className={styles["post-container"]}>
            <p>新規投稿する</p>
            <AutoAwesomeRoundedIcon />
          </div>
        </Button>
        <CurrentUserControl />
      </div>
    </header>
  );
};

export default Header;
