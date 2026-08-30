import { useCallback, useEffect, useState } from "react";

import styles from "./index.module.css";

import Popover, {
  type PopoverAlign,
  PopoverButton,
  type PopoverPlacement,
  type PopoverTextAlign,
} from "@/shared/ui/Popover";

import type { KeyboardEvent, RefObject } from "react";

export type ListboxOption<T> = {
  id: string | number;
  value: T;
  label: string;
};

type ListboxProps<T> = {
  id: string;
  isOpen: boolean;
  options: ListboxOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  selectedValue?: T;
  placement?: PopoverPlacement;
  align?: PopoverAlign;
  textAlign?: PopoverTextAlign;
  ariaLabel: string;
  className?: string;
};

const Listbox = <T,>({
  id,
  isOpen,
  options,
  onSelect,
  onClose,
  triggerRef,
  selectedValue,
  placement = "top",
  align = "center",
  textAlign,
  ariaLabel,
  className,
}: ListboxProps<T>) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedIndex =
    selectedValue === undefined
      ? -1
      : options.findIndex((option) => Object.is(option.value, selectedValue));

  const focusOption = useCallback(
    (index: number) => {
      setActiveIndex(index);
      document.getElementById(`${id}-option-${index}`)?.focus();
    },
    [id],
  );

  useEffect(() => {
    if (!isOpen || options.length === 0) {
      setActiveIndex(-1);
      return;
    }

    const isCombobox = triggerRef.current?.getAttribute("role") === "combobox";
    if (isCombobox) {
      setActiveIndex(-1);
      return;
    }

    focusOption(selectedIndex >= 0 ? selectedIndex : 0);
  }, [focusOption, isOpen, options.length, selectedIndex, triggerRef]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const handleTriggerKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isOpen || options.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusOption(activeIndex < options.length - 1 ? activeIndex + 1 : 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusOption(activeIndex > 0 ? activeIndex - 1 : options.length - 1);
      }
    };

    trigger.addEventListener("keydown", handleTriggerKeyDown);
    return () => trigger.removeEventListener("keydown", handleTriggerKeyDown);
  }, [activeIndex, focusOption, isOpen, options.length, triggerRef]);

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = index < options.length - 1 ? index + 1 : 0;
    } else if (event.key === "ArrowUp") {
      nextIndex = index > 0 ? index - 1 : options.length - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    focusOption(nextIndex);
  };

  const handleSelect = (value: T) => {
    onSelect(value);
    triggerRef.current?.focus();
    onClose();
  };

  return (
    <Popover
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      placement={placement}
      align={align}
      textAlign={textAlign}
      role="listbox"
      ariaLabel={ariaLabel}
      className={[styles["listbox"], className].filter(Boolean).join(" ")}
    >
      {options.map((option, index) => (
        <PopoverButton
          key={option.id}
          id={`${id}-option-${index}`}
          onClick={() => handleSelect(option.value)}
          onFocus={() => setActiveIndex(index)}
          onKeyDown={(event) => handleOptionKeyDown(event, index)}
          role="option"
          tabIndex={activeIndex === index ? 0 : -1}
          isSelected={
            selectedValue !== undefined &&
            Object.is(option.value, selectedValue)
          }
        >
          {option.label}
        </PopoverButton>
      ))}
    </Popover>
  );
};

export default Listbox;
