import { useId, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";
import Copyright from "@/shared/ui/Copyright";
import DevBadge from "@/shared/ui/DevBadge";
import { EXTERNAL_LINKS } from "@/shared/ui/externalLinks";
import { lockPageScroll } from "@/util/pageScroll";

import type { PointerEvent } from "react";

const Sidebar = () => {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const releaseScrollLockRef = useRef<(() => void) | null>(null);
  const isBackdropPointerDownRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const release = lockPageScroll();
    releaseScrollLockRef.current = release;
    return () => {
      release();
      releaseScrollLockRef.current = null;
    };
  }, [isOpen]);

  const handleOpen = () => {
    dialogRef.current?.showModal();
    setIsOpen(true);
  };

  const handleClose = () => {
    dialogRef.current?.close();
    releaseScrollLockRef.current?.();
    setIsOpen(false);
  };

  const isBackdrop = (event: PointerEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
      event.target === event.currentTarget &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        isIconOnly
        size="small"
        className={styles["sidebar-trigger"]}
        icon={<MenuRoundedIcon />}
        aria-label="サイドバーを開く"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={handleOpen}
      />
      <dialog
        id={dialogId}
        ref={dialogRef}
        className={styles["sidebar"]}
        aria-label="サイドバー"
        onClose={() => {
          if (dialogRef.current?.open) return;
          setIsOpen(false);
          isBackdropPointerDownRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          handleClose();
        }}
        onPointerDown={(event) => {
          isBackdropPointerDownRef.current = isBackdrop(event);
        }}
        onPointerUp={(event) => {
          if (isBackdropPointerDownRef.current && isBackdrop(event)) {
            handleClose();
          }
          isBackdropPointerDownRef.current = false;
        }}
        onPointerCancel={() => {
          isBackdropPointerDownRef.current = false;
        }}
      >
        <div className={styles["sidebar-header"]}>
          <Button
            variant="ghost"
            isIconOnly
            size="small"
            icon={<MenuRoundedIcon />}
            aria-label="サイドバーを閉じる"
            onClick={handleClose}
          />
          <Link to="/" aria-label="Toybox ホーム" onClick={handleClose}>
            <img
              src="/ToyboxLogo.svg"
              alt="Toybox"
              className={styles["logo-image"]}
            />
          </Link>
          <DevBadge />
        </div>
        <div className={styles["sidebar-content"]}>
          <nav aria-label="メインナビゲーション">
            <NavLink
              to="/"
              className={styles["navigation-link"]}
              onClick={handleClose}
            >
              <HomeRoundedIcon aria-hidden="true" />
              <span>ホーム</span>
            </NavLink>
            <hr className={styles["divider"]} />
            {EXTERNAL_LINKS.map(({ href, label, icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles["navigation-link"]}
                onClick={handleClose}
              >
                <span className={styles["link-icon"]} aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </a>
            ))}
            <hr className={styles["divider"]} />
            {accessToken && user && (
              <>
                <NavLink
                  to={`/users/${user.id}`}
                  className={styles["navigation-link"]}
                  onClick={handleClose}
                >
                  <span className={styles["link-icon"]} aria-hidden="true">
                    <Avatar avatarURL={user.icon_url} alt="" size="small" />
                  </span>
                  <span>マイページ</span>
                </NavLink>
                <hr className={styles["divider"]} />
              </>
            )}
          </nav>
          <footer className={styles["copyright"]}>
            <Copyright />
          </footer>
        </div>
      </dialog>
    </>
  );
};

export default Sidebar;
