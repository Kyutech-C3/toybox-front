import { createPortal } from "react-dom";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

import type { ReactNode } from "react";

type FloatingActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isFloatingHidden?: boolean;
};

const FloatingActionButton = ({
  label,
  icon,
  onClick,
  isFloatingHidden = false,
}: FloatingActionButtonProps) => (
  <>
    <div className={styles["header-action"]}>
      <Button
        variant="primary"
        className={styles["header-action-button"]}
        onClick={onClick}
        ariaLabel={label}
        icon={<span className={styles["icon"]}>{icon}</span>}
      >
        {label}
      </Button>
    </div>
    {!isFloatingHidden &&
      createPortal(
        <div className={styles["floating-action"]}>
          <Button
            variant="accent"
            isIconOnly
            className={styles["floating-action-button"]}
            onClick={onClick}
            ariaLabel={label}
            icon={<span className={styles["floating-icon"]}>{icon}</span>}
          />
        </div>,
        document.body,
      )}
  </>
);

export default FloatingActionButton;
