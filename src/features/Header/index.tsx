import { useState } from "react";
import Switch from "../ui/Switch";
import styles from "./index.module.css";

const Header = () => {
  const [isToy, setIsToy] = useState<boolean>(true);
  return (
    <header className={styles["header-wrapper"]}>
      <a href="/">
        <div className={styles["logo-wrapper"]}>
          <img src="./logo.webp" height={75} />
        </div>
      </a>
      <div className={styles["switch-wrapper"]}>
        <Switch setIsToy={setIsToy} isToy={isToy} />
      </div>
    </header>
  );
};

export default Header;
