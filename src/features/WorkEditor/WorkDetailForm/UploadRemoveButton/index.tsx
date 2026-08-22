import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import styles from "./index.module.css";

type UploadRemoveButtonProps = {
  className: string;
  onClick: () => void;
  isDisabled: boolean;
  ariaLabel: string;
};

const UploadRemoveButton = ({
  className,
  onClick,
  isDisabled,
  ariaLabel,
}: UploadRemoveButtonProps) => {
  return (
    <button
      type="button"
      className={`${styles["remove-button"]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      <CloseRoundedIcon />
    </button>
  );
};

export default UploadRemoveButton;
