import { useId, useRef, useState } from "react";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Listbox from "@/shared/ui/Listbox";

import type { ReactNode } from "react";
import type { ListboxOption } from "@/shared/ui/Listbox";

type SplitButtonProps<T> = {
  label: ReactNode;
  icon?: ReactNode;
  variant?: "accent" | "primary";
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  menuTriggerLabel: string;
  menuLabel: string;
  options: ListboxOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  notice?: ReactNode;
};

const SplitButton = <T,>({
  label,
  icon,
  variant = "accent",
  onClick,
  isDisabled = false,
  isLoading = false,
  menuTriggerLabel,
  menuLabel,
  options,
  selectedValue,
  onSelect,
  notice,
}: SplitButtonProps<T>) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxID = useId();

  return (
    <div className={styles["split-button"]} data-variant={variant}>
      <Button
        variant={variant}
        className={styles["main-button"]}
        onClick={onClick}
        disabled={isDisabled}
        isLoading={isLoading}
        icon={icon}
      >
        {label}
      </Button>
      <span className={styles["divider"]} aria-hidden="true" />
      <Button
        ref={triggerRef}
        variant={variant}
        isIconOnly
        icon={<ArrowDropUpRoundedIcon />}
        className={styles["menu-trigger"]}
        onClick={() => setIsMenuOpen((current) => !current)}
        disabled={isDisabled}
        aria-label={menuTriggerLabel}
        aria-haspopup="listbox"
        aria-expanded={isMenuOpen}
        aria-controls={listboxID}
      />
      <span className={styles["menu-container"]}>
        <Listbox
          id={listboxID}
          isOpen={isMenuOpen}
          options={options}
          onClose={() => setIsMenuOpen(false)}
          triggerRef={triggerRef}
          onSelect={(value) => {
            setIsMenuOpen(false);
            onSelect(value);
          }}
          selectedValue={selectedValue}
          placement="top"
          align="end"
          textAlign="center"
          ariaLabel={menuLabel}
          className={styles["menu"]}
        />
      </span>
      {notice && <div className={styles["notice"]}>{notice}</div>}
    </div>
  );
};

export default SplitButton;
