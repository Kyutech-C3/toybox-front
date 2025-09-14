import { useState } from "react";

import styles from "./index.module.css";

import Switch from "@/shared/ui/Switch";

const Header = () => {
  const [isToy, setIsToy] = useState<boolean>(true);
  return (
    <header className={styles["header-wrapper"]}>
      <a href="/">
        <div className={styles["logo-wrapper"]}>
          <img src="./logo.webp" alt="logo-image" height={75} />
        </div>
      </a>
      <div className={styles["switch-wrapper"]}>
        <Switch setIsToy={setIsToy} isToy={isToy} />
      </div>
    </header>
  );
};

export default Header;
