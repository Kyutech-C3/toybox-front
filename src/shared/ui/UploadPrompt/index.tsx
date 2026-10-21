import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import styles from "./index.module.css";

export const UPLOAD_PROMPT_LABEL = "選択またはドロップ";

const UploadPrompt = () => {
  return (
    <span className={styles["upload-prompt"]}>
      <CloudUploadRoundedIcon />
      <span>{UPLOAD_PROMPT_LABEL}</span>
    </span>
  );
};

export default UploadPrompt;
