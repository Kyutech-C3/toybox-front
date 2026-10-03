import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import IconActionButton from "@/shared/ui/IconActionButton";

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
    <IconActionButton
      isDestructive
      icon={<CloseRoundedIcon />}
      className={className}
      onClick={onClick}
      isDisabled={isDisabled}
      ariaLabel={ariaLabel}
    />
  );
};

export default UploadRemoveButton;
