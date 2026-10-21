import { useLayoutEffect, useRef } from "react";

import styles from "./index.module.css";

import { lockPageScroll } from "@/util/pageScroll";

import type { ComponentProps, PointerEvent, RefObject } from "react";

type DialogProps = Omit<
  ComponentProps<"dialog">,
  "open" | "ref" | "onClose"
> & {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isInitialFocusOnDialog?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  isBackdropPointer?: (event: PointerEvent<HTMLDialogElement>) => boolean;
};

type BackdropPress = { pointerId: number; x: number; y: number };

const TAP_TOLERANCE = 5;

const isNativeBackdrop = (event: PointerEvent<HTMLDialogElement>) => {
  const bounds = event.currentTarget.getBoundingClientRect();
  return (
    event.target === event.currentTarget &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  );
};

const Dialog = ({
  isOpen,
  onClose,
  initialFocusRef,
  isInitialFocusOnDialog = false,
  returnFocusRef,
  isBackdropPointer = isNativeBackdrop,
  className,
  children,
  onCancel,
  onKeyDown,
  onPointerDownCapture,
  onPointerMoveCapture,
  onPointerUpCapture,
  onPointerCancelCapture,
  onClickCapture,
  ...props
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointersRef = useRef(new Set<number>());
  const backdropPressRef = useRef<BackdropPress | null>(null);
  const isBackdropClickRef = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const release = lockPageScroll();
    dialog.showModal();
    const initialFocus = dialog.contains(previousFocus)
      ? previousFocus
      : isInitialFocusOnDialog
        ? dialog
        : initialFocusRef?.current;
    initialFocus?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      release();
      pointersRef.current.clear();
      backdropPressRef.current = null;
      isBackdropClickRef.current = false;
      queueMicrotask(() => {
        if (dialog.open) return;
        const returnFocus = returnFocusRef?.current ?? previousFocus;
        if (returnFocus?.isConnected)
          returnFocus.focus({ preventScroll: true });
      });
    };
  }, [isOpen, initialFocusRef, isInitialFocusOnDialog, returnFocusRef]);

  const hasMoved = (event: PointerEvent<HTMLDialogElement>) => {
    const press = backdropPressRef.current;
    return (
      press !== null &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) >
        TAP_TOLERANCE
    );
  };

  return (
    <dialog
      {...props}
      ref={dialogRef}
      className={[styles["dialog"], className].filter(Boolean).join(" ")}
      aria-modal={isOpen ? true : undefined}
      onClose={() => {
        if (!dialogRef.current?.open && isOpen) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onCancel?.(event);
        onClose();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !isOpen ||
          event.key !== "Escape" ||
          event.defaultPrevented ||
          event.nativeEvent.isComposing
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event);
        if (!isOpen) return;
        isBackdropClickRef.current = false;
        pointersRef.current.add(event.pointerId);
        backdropPressRef.current =
          event.button === 0 &&
          pointersRef.current.size === 1 &&
          isBackdropPointer(event)
            ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
            : null;
      }}
      onPointerMoveCapture={(event) => {
        onPointerMoveCapture?.(event);
        if (hasMoved(event)) backdropPressRef.current = null;
      }}
      onPointerUpCapture={(event) => {
        onPointerUpCapture?.(event);
        isBackdropClickRef.current =
          backdropPressRef.current?.pointerId === event.pointerId &&
          !hasMoved(event) &&
          isBackdropPointer(event);
        pointersRef.current.delete(event.pointerId);
        backdropPressRef.current = null;
      }}
      onPointerCancelCapture={(event) => {
        onPointerCancelCapture?.(event);
        pointersRef.current.delete(event.pointerId);
        backdropPressRef.current = null;
        isBackdropClickRef.current = false;
      }}
      onClickCapture={(event) => {
        if (!isOpen || !isBackdropClickRef.current) {
          onClickCapture?.(event);
          return;
        }
        // Keep the modal in the top layer until the closing click is consumed.
        isBackdropClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
};

export default Dialog;
