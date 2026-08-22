import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

import styles from "./index.module.css";

type UploadRetryButtonProps = {
  onClick: () => void;
};

const UploadRetryButton = ({ onClick }: UploadRetryButtonProps) => {
  return (
    <button type="button" className={styles["retry-button"]} onClick={onClick}>
      <ReplayRoundedIcon />
      再試行
    </button>
  );
};

export default UploadRetryButton;
