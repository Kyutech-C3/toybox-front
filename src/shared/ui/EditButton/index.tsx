import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";

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
  const buttonClassName = [styles["edit-button"], className]
    .filter(Boolean)
    .join(" ");
  if (to !== undefined)
    return (
      <Link
        to={to}
        className={buttonClassName}
        aria-label={ariaLabel}
        title="編集する"
      >
        <EditSquareIcon />
      </Link>
    );
  return (
    <Button
      className={buttonClassName}
      size="compact"
      isIconOnly
      icon={<EditSquareIcon />}
      ariaLabel={ariaLabel}
      onClick={onEdit}
      isDisabled={isDisabled}
    />
  );
};

export default EditButton;
