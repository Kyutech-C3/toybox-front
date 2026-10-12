type ScrollLock = {
  count: number;
  previousOverflow: string;
};

const SCROLL_LOCKS = new WeakMap<HTMLElement, ScrollLock>();

const getContentScroller = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-page-scroll]");

export const getPageScroller = (): HTMLElement =>
  getContentScroller() ?? document.documentElement;

export const lockPageScroll = (): (() => void) => {
  const scroller = getContentScroller() ?? document.body;
  const lock = SCROLL_LOCKS.get(scroller) ?? {
    count: 0,
    previousOverflow: scroller.style.overflow,
  };
  lock.count += 1;
  SCROLL_LOCKS.set(scroller, lock);
  scroller.style.overflow = "hidden";

  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;
    lock.count -= 1;
    if (lock.count === 0) {
      scroller.style.overflow = lock.previousOverflow;
      SCROLL_LOCKS.delete(scroller);
    }
  };
};
