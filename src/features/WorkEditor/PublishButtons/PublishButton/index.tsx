import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";

import styles from "./index.module.css";

const PublishButton = () => {
  return (
    <div className={styles["publish-button-wrapper"]}>
      <button type="button" className={styles["publish-button"]}>
        限定公開
      </button>
      <span className={styles["button-span"]} />
      <button type="button" className={styles["menu-button"]}>
        <ArrowDropUpRoundedIcon />
      </button>
    </div>
  );
};
export default PublishButton;
