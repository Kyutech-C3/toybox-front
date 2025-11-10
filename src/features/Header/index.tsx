import { useState } from "react";
import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Switch from "@/shared/ui/Switch";

const Header = () => {
  const [isToy, setIsToy] = useState<boolean>(true);
  return (
    <header className={styles["header-wrapper"]}>
      <div className={styles["logo-wrapper"]}>
        <Link to="/">
          <img src="/logo.webp" alt="logo-image" height={75} />
        </Link>
      </div>
      <div className={styles["switch-wrapper"]}>
        <Switch setIsToy={setIsToy} isToy={isToy} />
      </div>
    </header>
  );
};

export default Header;
