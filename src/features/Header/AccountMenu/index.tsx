import { useRef, useState } from "react";

import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import Popover, {
  PopoverButton,
  PopoverLabel,
  PopoverLink,
} from "@/shared/ui/Popover";

import type { UserProfile } from "@/features/auth/store/useUserStore";

type AccountMenuProps = {
  user: UserProfile;
  onLogout: () => Promise<void>;
};

const ACCOUNT_MENU_ID = "header-account-menu";

const AccountMenu = ({ user, onLogout }: AccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    <div className={styles["account-menu-wrapper"]}>
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
        <Avatar
          avatarURL={user.icon_url}
          alt={`${user.display_name}のアバター`}
        />
      </button>
      <Popover
        id={ACCOUNT_MENU_ID}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        role="menu"
        ariaLabel="アカウントメニュー"
        isAutoFocusEnabled
        className={styles["account-menu"]}
        textAlign="center"
      >
        <PopoverLabel>{user.display_name}</PopoverLabel>
        <PopoverLink to={`/user/${user.id}`} onClick={() => setIsOpen(false)}>
          マイページ
        </PopoverLink>
        <PopoverButton
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? "ログアウト中..." : "ログアウト"}
        </PopoverButton>
      </Popover>
    </div>
  );
};

export default AccountMenu;
