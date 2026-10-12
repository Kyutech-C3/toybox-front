import { useLayoutEffect, useState, useSyncExternalStore } from "react";

import { getPageScrollTop, isPageScrollLocked } from "@/util/pageScroll";

import type { DataRouter } from "react-router-dom";

type PageScrollRestorationProps = {
  router: DataRouter;
};

const STORAGE_KEY = "react-router-scroll-positions";

const PageScrollRestoration = ({ router }: PageScrollRestorationProps) => {
  const { location, restoreScrollPosition, preventScrollReset } =
    useSyncExternalStore(router.subscribe, () => router.state);
  const [positions] = useState<Record<string, number>>(() => {
    const savedPositions: Record<string, number> = {};
    try {
      const stored: unknown = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) ?? "{}",
      );
      if (stored && typeof stored === "object") {
        Object.entries(stored).forEach(([key, value]) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            savedPositions[key] = value;
          }
        });
      }
    } catch {
      // 保存できない環境でも、同じタブ内の履歴移動は復元する。
    }
    return savedPositions;
  });

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const disableRestoration = router.enableScrollRestoration(
      positions,
      getPageScrollTop,
    );
    const handlePageHide = () => {
      if (router.state.navigation.state === "idle") {
        positions[router.state.location.key] = getPageScrollTop();
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch {
        // sessionStorage が使えない場合も画面遷移は継続する。
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      disableRestoration();
      window.removeEventListener("pagehide", handlePageHide);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [router, positions]);

  useLayoutEffect(() => {
    if (restoreScrollPosition === false) return;

    const restore = () => {
      if (
        isPageScrollLocked() ||
        document.querySelector('[data-page-loading="true"]')
      ) {
        return;
      }

      if (typeof restoreScrollPosition === "number") {
        window.scrollTo({ top: restoreScrollPosition, behavior: "instant" });
      } else {
        let target: HTMLElement | null = null;
        if (location.hash) {
          try {
            target = document.getElementById(
              decodeURIComponent(location.hash.slice(1)),
            );
          } catch {
            // 不正な fragment は通常のページ移動として扱う。
          }
        }
        if (target) target.scrollIntoView({ behavior: "instant" });
        else if (!preventScrollReset) {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
      observer.disconnect();
    };
    const observer = new MutationObserver(restore);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });
    restore();
    return () => observer.disconnect();
  }, [location, restoreScrollPosition, preventScrollReset]);

  return null;
};

export default PageScrollRestoration;
