import { useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

import type { ReactNode } from "react";

export interface DropdownOption<T extends string | number> {
  value: T;
  label?: string;
}

interface DropdownProps<T extends string | number> {
  trigger: ReactNode;
  options: T[] | DropdownOption<T>[];
  onSelect: (value: T) => void;
  selectedValues?: T[];
  position?: "top" | "bottom";
  className?: string;
  dropdownClassName?: string;
}

export const Dropdown = <T extends string | number>({
  trigger,
  options,
  onSelect,
  selectedValues = [],
  position = "top",
  className,
  dropdownClassName,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (value: T) => {
    onSelect(value);
    setIsOpen(false);
  };

  const normalizedOptions: DropdownOption<T>[] = options.map((opt) =>
    typeof opt === "object" && "value" in opt
      ? opt
      : { value: opt as T, label: String(opt) },
  );

  return (
    <div className={`${styles.container} ${className || ""}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`${styles.dropdown} ${
            position === "bottom"
              ? styles["dropdown-bottom"]
              : styles["dropdown-top"]
          } ${dropdownClassName || ""}`}
          role="menu"
        >
          <div className={styles["scroll-container"]}>
            {normalizedOptions.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={`${styles.item} ${
                  selectedValues.includes(option.value)
                    ? styles["item-active"]
                    : ""
                }`}
                onClick={() => handleSelect(option.value)}
                role="menuitem"
                aria-label={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
