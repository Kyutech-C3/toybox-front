import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import styles from "./index.module.css";

type UploadRetryButtonProps = {
  className: string;
  onClick: () => void;
  isDisabled: boolean;
  ariaLabel: string;
};

const UploadRetryButton = ({
  className,
  onClick,
  isDisabled,
  ariaLabel,
}: UploadRetryButtonProps) => {
  return (
    <button
      type="button"
      className={`${styles["retry-button"]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      <RefreshRoundedIcon />
    </button>
  );
};

export default UploadRetryButton;
