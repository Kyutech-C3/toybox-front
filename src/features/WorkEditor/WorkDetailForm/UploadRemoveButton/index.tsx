import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import Button from "@/shared/ui/Button";

type UploadRemoveButtonProps = {
  className?: string;
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
    <Button
      variant="destructive"
      size="small"
      isIconOnly
      icon={<CloseRoundedIcon />}
      className={className}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    />
  );
};

export default UploadRemoveButton;
