import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import styles from "./index.module.css";

const UploadPrompt = () => {
  return (
    <span className={styles["upload-prompt"]}>
      <CloudUploadRoundedIcon />
      <span>選択またはドロップ</span>
    </span>
  );
};

export default UploadPrompt;
