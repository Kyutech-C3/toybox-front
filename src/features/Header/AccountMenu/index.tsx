import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";

import type { UserProfile } from "@/features/auth/store/useUserStore";

type AccountMenuProps = {
  user: UserProfile;
  onLogout: () => Promise<void>;
};

const ACCOUNT_MENU_ID = "header-account-menu";

const AccountMenu = ({ user, onLogout }: AccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const userPageLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    userPageLinkRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles["account-menu-wrapper"]} ref={wrapperRef}>
      <button
        type="button"
        className={styles["account-menu-trigger"]}
        aria-label="アカウントメニューを開く"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={ACCOUNT_MENU_ID}
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
        ref={triggerRef}
      >
        <Avatar avatarURL={user.icon_url} />
      </button>
      {isOpen && (
        <div
          id={ACCOUNT_MENU_ID}
          className={styles["account-menu"]}
          role="menu"
          aria-label="アカウントメニュー"
        >
          <p className={styles["display-name"]}>{user.display_name}</p>
          <Link
            to={`/user/${user.id}`}
            className={styles["menu-item"]}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            ref={userPageLinkRef}
          >
            マイページ
          </Link>
          <button
            type="button"
            className={styles["menu-item"]}
            role="menuitem"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
