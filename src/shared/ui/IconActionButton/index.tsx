import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

import type { ReactNode } from "react";

type IconActionButtonProps = {
  ariaLabel: string;
  icon: ReactNode;
  title?: string;
  isDestructive?: boolean;
  className?: string;
} & (
  | { to: string; onClick?: never; isDisabled?: never }
  | { to?: never; onClick: () => void; isDisabled?: boolean }
);

const IconActionButton = ({
  ariaLabel,
  icon,
  title,
  isDestructive = false,
  className,
  to,
  onClick,
  isDisabled,
}: IconActionButtonProps) => {
  const buttonClassName = [styles["icon-action-button"], className]
    .filter(Boolean)
    .join(" ");
  if (to !== undefined)
    return (
      <Link
        to={to}
        className={buttonClassName}
        aria-label={ariaLabel}
        title={title}
        data-destructive={isDestructive || undefined}
      >
        {icon}
      </Link>
    );
  return (
    <Button
      className={buttonClassName}
      size="compact"
      isIconOnly
      icon={icon}
      title={title}
      data-destructive={isDestructive || undefined}
      ariaLabel={ariaLabel}
      onClick={onClick}
      isDisabled={isDisabled}
    />
  );
};

export default IconActionButton;
