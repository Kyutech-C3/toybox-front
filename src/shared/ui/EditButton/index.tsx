import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import IconActionButton from "@/shared/ui/IconActionButton";

type EditButtonProps = {
  ariaLabel: string;
  className?: string;
} & (
  | { to: string; onEdit?: never; isDisabled?: never }
  | { to?: never; onEdit: () => void; isDisabled?: boolean }
);

const EditButton = ({
  ariaLabel,
  className,
  to,
  onEdit,
  isDisabled,
}: EditButtonProps) => {
  if (to !== undefined)
    return (
      <IconActionButton
        to={to}
        className={className}
        ariaLabel={ariaLabel}
        title="編集する"
        icon={<EditSquareIcon />}
      />
    );
  return (
    <IconActionButton
      onClick={onEdit}
      className={className}
      ariaLabel={ariaLabel}
      isDisabled={isDisabled}
      icon={<EditSquareIcon />}
    />
  );
};

export default EditButton;
