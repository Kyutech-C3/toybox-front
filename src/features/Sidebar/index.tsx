import { useId, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BookRoundedIcon from "@mui/icons-material/BookRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";
import Copyright from "@/shared/ui/Copyright";
import DevBadge from "@/shared/ui/DevBadge";
import Dialog from "@/shared/ui/Dialog";
import { EXTERNAL_LINKS } from "@/shared/ui/ExternalLinks";
import { getPageScroller } from "@/util/pageScroll";

import type { ExternalLinkItem } from "@/shared/ui/ExternalLinks";

const SIDEBAR_EXTERNAL_LINKS = [
  EXTERNAL_LINKS.officialSite,
  {
    href: "https://compositecomputer.club/blog",
    label: "C3 ブログ",
    icon: <BookRoundedIcon />,
  },
  EXTERNAL_LINKS.x,
  EXTERNAL_LINKS.youtube,
  EXTERNAL_LINKS.github,
] satisfies ExternalLinkItem[];

const Sidebar = () => {
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openedLocationKeyRef = useRef<string | null>(null);
  const { key: locationKey } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPointerOpen, setIsPointerOpen] = useState(false);
  const [isPointerFocus, setIsPointerFocus] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);

  const handleClose = () => setIsClosing(true);

  useLayoutEffect(() => {
    if (isOpen || openedLocationKeyRef.current === null) return;
    const hasNavigated = openedLocationKeyRef.current !== locationKey;
    openedLocationKeyRef.current = null;
    // Dialog のスクロール固定解除後、成立した遷移の表示位置を確定する。
    if (hasNavigated) {
      getPageScroller().scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [isOpen, locationKey]);

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
        data-pointer-focus={isPointerFocus ? "true" : "false"}
        ref={triggerRef}
        onBlur={() => setIsPointerFocus(false)}
        onKeyDown={() => setIsPointerFocus(false)}
        onClick={(event) => {
          openedLocationKeyRef.current = locationKey;
          setIsPointerOpen(event.detail > 0);
          setIsClosing(false);
          setIsOpen(true);
        }}
      />
      <Dialog
        id={dialogId}
        isOpen={isOpen}
        onClose={handleClose}
        isInitialFocusOnDialog={isPointerOpen}
        returnFocusRef={triggerRef}
        className={styles["sidebar"]}
        aria-label="サイドバー"
        data-closing={isClosing ? "true" : "false"}
        onAnimationEnd={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.animationName !== styles["sidebar-close"] ||
            !isClosing
          )
            return;
          setIsOpen(false);
          setIsClosing(false);
        }}
        onPointerDownCapture={(event) => {
          if (event.button === 0) setIsPointerFocus(true);
        }}
        onKeyDownCapture={() => setIsPointerFocus(false)}
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
            {accessToken && user && (
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
            )}
            <hr className={styles["divider"]} />
            {SIDEBAR_EXTERNAL_LINKS.map(({ href, label, icon }) => (
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
          </nav>
          <footer className={styles["copyright"]}>
            <Copyright />
          </footer>
        </div>
      </Dialog>
    </>
  );
};

export default Sidebar;
