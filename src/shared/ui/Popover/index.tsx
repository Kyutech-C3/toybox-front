import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import styles from "./index.module.css";

import type { ButtonHTMLAttributes, ReactNode, RefObject } from "react";

export type PopoverPlacement = "top" | "bottom";
export type PopoverAlign = "start" | "center" | "end";
export type PopoverTextAlign = "left" | "center";

type PopoverProps = {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
  placement?: PopoverPlacement;
  align?: PopoverAlign;
  textAlign?: PopoverTextAlign;
  role: "menu" | "listbox";
  ariaLabel: string;
  isAutoFocusEnabled?: boolean;
  className?: string;
};

const Popover = ({
  id,
  isOpen,
  onClose,
  children,
  triggerRef,
  placement = "bottom",
  align = "end",
  textAlign = "left",
  role,
  ariaLabel,
  isAutoFocusEnabled = false,
  className,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (isAutoFocusEnabled) {
      popoverRef.current
        ?.querySelector<HTMLElement>(
          '[role="menuitem"]:not([disabled]), [role="option"]:not([disabled])',
        )
        ?.focus();
    }

    const isInsidePopover = (target: EventTarget | null) =>
      target instanceof Node &&
      (popoverRef.current?.contains(target) ||
        triggerRef?.current?.contains(target));

    const handlePointerDown = (event: PointerEvent) => {
      if (!isInsidePopover(event.target)) {
        onCloseRef.current();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!isInsidePopover(event.target)) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      onCloseRef.current();
      triggerRef?.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAutoFocusEnabled, isOpen, triggerRef]);

  if (!isOpen) return null;

  const popoverClassName = [
    styles["popover"],
    styles[`popover-${placement}`],
    styles[`popover-align-${align}`],
    styles[`popover-text-align-${textAlign}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const accessibilityProps =
    role === "listbox"
      ? ({ role: "listbox", "aria-label": ariaLabel } as const)
      : ({ role: "menu", "aria-label": ariaLabel } as const);

  return (
    <div
      id={id}
      ref={popoverRef}
      className={popoverClassName}
      {...accessibilityProps}
    >
      {children}
    </div>
  );
};

type PopoverLabelProps = {
  children: ReactNode;
};

export const PopoverLabel = ({ children }: PopoverLabelProps) => (
  <p className={styles["popover-label"]} role="presentation">
    {children}
  </p>
);

type PopoverButtonProps = {
  children: ReactNode;
  isSelected?: boolean;
  role?: "menuitem" | "option";
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "aria-label"
  | "disabled"
  | "id"
  | "onClick"
  | "onFocus"
  | "onKeyDown"
  | "tabIndex"
>;

export const PopoverButton = ({
  children,
  isSelected = false,
  role = "menuitem",
  ...props
}: PopoverButtonProps) => {
  const accessibilityProps =
    role === "option"
      ? ({ role: "option", "aria-selected": isSelected } as const)
      : ({ role: "menuitem" } as const);

  return (
    <button
      type="button"
      className={styles["popover-item"]}
      data-selected={isSelected || undefined}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </button>
  );
};

type PopoverLinkProps = {
  to: string;
  children: ReactNode;
  onClick?: () => void;
};

export const PopoverLink = ({ to, children, onClick }: PopoverLinkProps) => (
  <Link
    to={to}
    className={styles["popover-item"]}
    role="menuitem"
    onClick={onClick}
  >
    {children}
  </Link>
);

export default Popover;
