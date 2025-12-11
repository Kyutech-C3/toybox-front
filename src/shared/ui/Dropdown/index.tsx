import styles from "./index.module.css";

import type { ReactNode } from "react";

export interface DropdownOption<T> {
  value: T;
  label?: string;
}

interface DropdownProps<T> {
  // 開閉状態（外部制御）
  isOpen: boolean;
  // オプション（配列または DropdownOption の配列）
  options: T[] | DropdownOption<T>[];
  // 選択時のコールバック
  onSelect: (value: T) => void;
  // 現在選択されている値（複数選択対応）
  selectedValues?: T[];
  // ドロップダウンの位置（デフォルト: "top"）
  position?: "top" | "bottom";
  // カスタムクラス名
  className?: string;
  // ドロップダウンメニューのカスタムクラス名
  dropdownClassName?: string;
  // カスタムレンダリング（高度なカスタマイズ用）
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
}

export const Dropdown = <T extends string | number>({
  isOpen,
  options,
  onSelect,
  selectedValues = [],
  position = "top",
  className,
  dropdownClassName,
  renderOption,
}: DropdownProps<T>) => {
  // オプションを正規化（配列を DropdownOption 形式に変換）
  const normalizedOptions: DropdownOption<T>[] = options.map((opt) =>
    typeof opt === "object" && "value" in opt
      ? opt
      : { value: opt as T, label: String(opt) },
  );

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.dropdown} ${
        position === "bottom"
          ? styles["dropdown-bottom"]
          : styles["dropdown-top"]
      } ${dropdownClassName || ""} ${className || ""}`}
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
              key={String(option.value)}
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
