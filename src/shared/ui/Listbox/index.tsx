import styles from "./index.module.css";

import Popover, {
  type PopoverAlign,
  PopoverButton,
  type PopoverPlacement,
  type PopoverTextAlign,
} from "@/shared/ui/Popover";

import type { RefObject } from "react";

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
}: ListboxProps<T>) => (
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
    className={styles["listbox"]}
  >
    {options.map((option) => (
      <PopoverButton
        key={option.id}
        onClick={() => onSelect(option.value)}
        role="option"
        isSelected={
          selectedValue !== undefined && Object.is(option.value, selectedValue)
        }
      >
        {option.label}
      </PopoverButton>
    ))}
  </Popover>
);

export default Listbox;
