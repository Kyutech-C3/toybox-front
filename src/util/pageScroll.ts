type ScrollLock = {
  count: number;
  scrollTop: number;
  restore: () => void;
};

const SCROLL_LOCKS = new WeakMap<HTMLElement, ScrollLock>();

export const getPageScroller = (): HTMLElement => document.documentElement;

const createScrollLock = (scroller: HTMLElement): ScrollLock => {
  const scrollTop = scroller.scrollTop;
  const scrollLeft = scroller.scrollLeft;
  const hasScrollOverflow = scroller.scrollHeight > scroller.clientHeight;
  const previousOverflowY = scroller.style.overflowY;
  let isRestored = false;

  scroller.style.setProperty("--page-scroll-top", `${scrollTop}px`);
  scroller.style.overflowY = hasScrollOverflow ? "scroll" : "auto";
  scroller.setAttribute("data-scroll-locked", "true");

  const lock: ScrollLock = {
    count: 0,
    scrollTop,
    restore: () => {
      if (isRestored) return;
      isRestored = true;
      scroller.removeAttribute("data-scroll-locked");
      scroller.style.removeProperty("--page-scroll-top");
      scroller.style.overflowY = previousOverflowY;
      scroller.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: "instant",
      });
      if (SCROLL_LOCKS.get(scroller) === lock) SCROLL_LOCKS.delete(scroller);
    },
  };
  return lock;
};

export const getPageScrollTop = (): number => {
  const scroller = getPageScroller();
  return SCROLL_LOCKS.get(scroller)?.scrollTop ?? scroller.scrollTop;
};

export const isPageScrollLocked = (): boolean =>
  SCROLL_LOCKS.has(getPageScroller());

export const lockPageScroll = (): (() => void) => {
  const scroller = getPageScroller();
  const lock = SCROLL_LOCKS.get(scroller) ?? createScrollLock(scroller);
  lock.count += 1;
  SCROLL_LOCKS.set(scroller, lock);

  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;
    lock.count -= 1;
    if (lock.count === 0) {
      lock.restore();
    }
  };
};
