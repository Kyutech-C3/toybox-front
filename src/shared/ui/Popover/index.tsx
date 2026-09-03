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
      const isReturningToMenuTrigger =
        role === "menu" &&
        event.target instanceof Node &&
        triggerRef?.current?.contains(event.target) &&
        event.relatedTarget instanceof Node &&
        popoverRef.current?.contains(event.relatedTarget);

      if (!isInsidePopover(event.target) || isReturningToMenuTrigger) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        triggerRef?.current?.focus();
        return;
      }

      if (
        role !== "menu" ||
        !(event.target instanceof HTMLElement) ||
        !popoverRef.current?.contains(event.target)
      ) {
        return;
      }

      const menuItems = Array.from(
        popoverRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([disabled])',
        ),
      );
      const currentIndex = menuItems.indexOf(event.target);
      if (currentIndex < 0) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowDown") {
        nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
      } else if (event.key === "ArrowUp") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = menuItems.length - 1;
      }

      if (nextIndex === null) return;

      event.preventDefault();
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAutoFocusEnabled, isOpen, role, triggerRef]);

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
  isDestructive?: boolean;
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
  isDestructive = false,
  role = "menuitem",
  tabIndex,
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
      data-destructive={isDestructive || undefined}
      tabIndex={tabIndex ?? (role === "menuitem" ? -1 : undefined)}
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
    tabIndex={-1}
    onClick={onClick}
  >
    {children}
  </Link>
);

export default Popover;
