const PAGE_SCROLL_LOCK = {
  count: 0,
  scrollTop: 0,
  scrollLeft: 0,
  overflowY: "",
};

export const getPageScroller = (): HTMLElement => document.documentElement;

export const scrollPageToTop = (): void => {
  if (PAGE_SCROLL_LOCK.count > 0) {
    // 閉じるアニメーション中も本文を先頭に表示し、解除時の位置も揃える。
    PAGE_SCROLL_LOCK.scrollTop = 0;
    PAGE_SCROLL_LOCK.scrollLeft = 0;
    getPageScroller().style.setProperty("--page-scroll-top", "0px");
    return;
  }
  getPageScroller().scrollTo({ top: 0, left: 0, behavior: "instant" });
};

export const lockPageScroll = (): (() => void) => {
  const scroller = getPageScroller();
  if (PAGE_SCROLL_LOCK.count === 0) {
    PAGE_SCROLL_LOCK.scrollTop = scroller.scrollTop;
    PAGE_SCROLL_LOCK.scrollLeft = scroller.scrollLeft;
    PAGE_SCROLL_LOCK.overflowY = scroller.style.overflowY;
    scroller.style.setProperty("--page-scroll-top", `${scroller.scrollTop}px`);
    scroller.style.overflowY =
      scroller.scrollHeight > scroller.clientHeight ? "scroll" : "auto";
    scroller.setAttribute("data-scroll-locked", "true");
  }
  PAGE_SCROLL_LOCK.count += 1;

  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;
    PAGE_SCROLL_LOCK.count -= 1;
    if (PAGE_SCROLL_LOCK.count === 0) {
      scroller.removeAttribute("data-scroll-locked");
      scroller.style.removeProperty("--page-scroll-top");
      scroller.style.overflowY = PAGE_SCROLL_LOCK.overflowY;
      scroller.scrollTo({
        top: PAGE_SCROLL_LOCK.scrollTop,
        left: PAGE_SCROLL_LOCK.scrollLeft,
        behavior: "instant",
      });
    }
  };
};
