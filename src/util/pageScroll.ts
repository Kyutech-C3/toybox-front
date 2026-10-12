type ScrollLock = {
  count: number;
  restore: () => void;
};

const SCROLL_LOCKS = new WeakMap<HTMLElement, ScrollLock>();

const getContentScroller = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-page-scroll]");

export const getPageScroller = (): HTMLElement =>
  getContentScroller() ?? document.documentElement;

const createScrollLock = (scroller: HTMLElement): ScrollLock => {
  if (scroller.hasAttribute("data-page-scroll")) {
    const scrollTop = scroller.scrollTop;
    const scrollLeft = scroller.scrollLeft;
    scroller.style.setProperty("--page-scroll-top", `${scrollTop}px`);
    scroller.setAttribute("data-scroll-locked", "true");
    return {
      count: 0,
      restore: () => {
        scroller.removeAttribute("data-scroll-locked");
        scroller.style.removeProperty("--page-scroll-top");
        scroller.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: "instant",
        });
      },
    };
  }

  const previousOverflow = scroller.style.overflow;
  scroller.style.overflow = "hidden";
  return {
    count: 0,
    restore: () => {
      scroller.style.overflow = previousOverflow;
    },
  };
};

export const lockPageScroll = (): (() => void) => {
  const scroller = getContentScroller() ?? document.body;
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
      SCROLL_LOCKS.delete(scroller);
    }
  };
};
