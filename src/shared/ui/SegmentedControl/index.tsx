import { useId } from "react";

import styles from "./index.module.css";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  isLabelVisible?: boolean;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onDeselect?: () => void;
  ariaLabel: string;
  role?: "radiogroup" | "tablist";
  getOptionID?: (value: T) => string;
  controlsID?: string;
};

type SegmentedControlStyle = CSSProperties & {
  "--segment-count"?: number;
  "--segment-index"?: number;
};

const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  onDeselect,
  ariaLabel,
  role = "radiogroup",
  getOptionID,
  controlsID,
}: SegmentedControlProps<T>) => {
  const groupName = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const controlStyle: SegmentedControlStyle = {
    "--segment-count": options.length,
    "--segment-index": Math.max(selectedIndex, 0),
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();

    const offset = event.key === "ArrowRight" ? 1 : -1;
    const startIndex = selectedIndex < 0 && offset < 0 ? 0 : selectedIndex;
    const nextOption =
      options[(startIndex + offset + options.length) % options.length];
    if (!nextOption) return;

    onChange(nextOption.value);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-value="${nextOption.value}"]`)
      ?.focus();
  };

  const renderContent = (option: SegmentedControlOption<T>) => (
    <>
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
    </>
  );

  const segments = (
    <>
      <span className={styles["segment-thumb"]} aria-hidden="true" />
      {options.map((option) =>
        onDeselect ? (
          <button
            key={option.value}
            type="button"
            className={styles["segment"]}
            data-value={option.value}
            data-selected={option.value === value ? "true" : "false"}
            aria-pressed={option.value === value}
            title={option.isLabelVisible === false ? option.label : undefined}
            onClick={() =>
              option.value === value ? onDeselect() : onChange(option.value)
            }
          >
            {renderContent(option)}
          </button>
        ) : role === "tablist" ? (
          <button
            key={option.value}
            type="button"
            className={styles["segment"]}
            id={getOptionID?.(option.value)}
            data-value={option.value}
            data-selected={option.value === value ? "true" : "false"}
            role="tab"
            aria-selected={option.value === value}
            aria-controls={controlsID}
            tabIndex={option.value === value ? 0 : -1}
            title={option.isLabelVisible === false ? option.label : undefined}
            onClick={() => onChange(option.value)}
          >
            {renderContent(option)}
          </button>
        ) : (
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
            {renderContent(option)}
          </label>
        ),
      )}
    </>
  );

  if (onDeselect) {
    return (
      <fieldset
        className={styles["segmented-control"]}
        style={controlStyle}
        aria-label={ariaLabel}
        data-has-selection={selectedIndex >= 0 ? "true" : "false"}
        onKeyDown={handleTabKeyDown}
      >
        {segments}
      </fieldset>
    );
  }

  const currentIndex = Math.max(selectedIndex, 0);
  const currentOption = options[currentIndex];
  const nextOption = options[(currentIndex + 1) % options.length];
  const toggle = options.length === 2 && currentOption && nextOption && (
    <button
      type="button"
      className={styles["toggle"]}
      data-position={currentIndex}
      aria-label={`${ariaLabel}：${currentOption.label}。押すと${nextOption.label}に切り替え`}
      aria-controls={controlsID}
      onClick={() => onChange(nextOption.value)}
    >
      <span className={styles["toggle-thumb"]}>
        <span className={styles["toggle-labels"]} aria-hidden="true">
          {options.map((option) => (
            <span
              key={option.value}
              className={styles["toggle-label"]}
              data-current={
                option.value === currentOption.value ? "true" : "false"
              }
              data-label={option.label}
            >
              {option.icon && (
                <span className={styles["segment-icon"]}>{option.icon}</span>
              )}
            </span>
          ))}
        </span>
      </span>
    </button>
  );

  const control =
    role === "tablist" ? (
      <div
        className={styles["segmented-control"]}
        style={controlStyle}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        data-has-toggle={toggle ? "true" : "false"}
        onKeyDown={handleTabKeyDown}
      >
        {segments}
      </div>
    ) : (
      <div
        className={styles["segmented-control"]}
        style={controlStyle}
        role="radiogroup"
        aria-label={ariaLabel}
        data-has-toggle={toggle ? "true" : "false"}
      >
        {segments}
      </div>
    );

  return (
    <>
      {control}
      {toggle}
    </>
  );
};

export default SegmentedControl;
