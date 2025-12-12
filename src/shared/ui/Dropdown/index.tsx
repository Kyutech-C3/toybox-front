import styles from "./index.module.css";

import type { ReactNode } from "react";
import type { Tag } from "@/shared/types/work";

export interface DropdownOption<T> {
  value: T;
  label?: string;
}

interface DropdownProps<T> {
  isOpen: boolean;
  options: T[] | DropdownOption<T>[];
  onSelect: (value: T) => void;
  selectedValues?: T[];
  position?: "top" | "bottom";
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
}

export const Dropdown = <T extends string | number | Tag>({
  isOpen,
  options,
  onSelect,
  selectedValues = [],
  position = "top",
  renderOption,
}: DropdownProps<T>) => {
  const normalizedOptions: DropdownOption<T>[] = options.map((opt) => {
    if (typeof opt === "object" && "value" in opt) {
      return opt;
    }

    // Tag型の場合はnameプロパティを使用
    if (typeof opt === "object" && "name" in opt) {
      return { value: opt as T, label: (opt as Tag).name };
    }

    return { value: opt as T, label: String(opt) };
  });

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.dropdown} ${
        position === "bottom"
          ? styles["dropdown-bottom"]
          : styles["dropdown-top"]
      }`}
      role="menu"
    >
      <div className={styles["scroll-container"]}>
        {normalizedOptions.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          if (renderOption) {
            return (
              <div
                key={String(option.value)}
                onClick={() => onSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(option.value);
                  }
                }}
                role="menuitem"
                tabIndex={0}
              >
                {renderOption(option, isSelected)}
              </div>
            );
          }

          return (
            <button
              key={String(option.label)}
              type="button"
              className={`${styles.item} ${
                isSelected ? styles["item-active"] : ""
              }`}
              onClick={() => onSelect(option.value)}
              role="menuitem"
              aria-label={option.label}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dropdown;
