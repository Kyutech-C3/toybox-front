import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

import type { ReactNode } from "react";

type FloatingActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

const FloatingActionButton = ({
  label,
  icon,
  onClick,
}: FloatingActionButtonProps) => (
  <div className={styles["floating-action"]}>
    <Button
      variant="primary"
      className={styles["floating-action-button"]}
      onClick={onClick}
      ariaLabel={label}
      icon={<span className={styles["icon"]}>{icon}</span>}
    >
      <span className={styles["label"]}>{label}</span>
    </Button>
  </div>
);

export default FloatingActionButton;
