import { useId } from "react";

import styles from "./index.module.css";

import type { CSSProperties, ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  isLabelVisible?: boolean;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
};

type SegmentedControlStyle = CSSProperties & {
  "--segment-count"?: number;
  "--segment-index"?: number;
};

const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) => {
  const groupName = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const controlStyle: SegmentedControlStyle = {
    "--segment-count": options.length,
    "--segment-index": Math.max(selectedIndex, 0),
  };

  return (
    <div
      className={styles["segmented-control"]}
      style={controlStyle}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <span className={styles["segment-thumb"]} aria-hidden="true" />
      {options.map((option) => (
        <label
          key={option.value}
          className={styles["segment"]}
          data-selected={option.value === value ? "true" : "false"}
          title={option.isLabelVisible === false ? option.label : undefined}
        >
          <input
            type="radio"
            className={styles["segment-input"]}
            name={groupName}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.icon && (
            <span className={styles["segment-icon"]} aria-hidden="true">
              {option.icon}
            </span>
          )}
          <span
            className={
              option.isLabelVisible === false
                ? styles["segment-label-hidden"]
                : styles["segment-label"]
            }
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default SegmentedControl;
