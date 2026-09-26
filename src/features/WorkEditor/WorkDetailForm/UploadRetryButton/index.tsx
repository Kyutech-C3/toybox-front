import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import Button from "@/shared/ui/Button";

type UploadRetryButtonProps = {
  className?: string;
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
    <Button
      variant="primary"
      size="small"
      isIconOnly
      icon={<RefreshRoundedIcon />}
      className={className}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    />
  );
};

export default UploadRetryButton;
