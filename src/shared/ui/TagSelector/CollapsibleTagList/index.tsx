import {
  Children,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Dialog from "@/shared/ui/Dialog";

import type { CSSProperties, ReactNode } from "react";

type CollapsibleTagListProps = {
  toolbar: ReactNode;
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  leadingItems?: ReactNode;
  children: ReactNode;
  isHeightKept?: boolean;
};

type RowLayout = {
  coveredRowTop: number;
  collapsedHeight: number;
};

type CollapsibleTagListStyle = CSSProperties & {
  "--tag-covered-row-top"?: string;
  "--tag-collapsed-height"?: string;
  "--tag-kept-height"?: string;
  "--tag-panel-kept-height"?: string;
  "--tag-panel-kept-width"?: string;
  "--tag-panel-top"?: string;
  "--tag-panel-left"?: string;
  "--tag-panel-width"?: string;
};

type FocusRequest = "first-hidden-item" | null;

const VISIBLE_ROW_COUNT = 4;

const getItems = (list: HTMLElement) =>
  Array.from(list.children).filter(
    (item): item is HTMLElement => item instanceof HTMLElement,
  );

const isHiddenWhenCollapsed = (
  list: HTMLElement,
  item: HTMLElement,
  coveredRowTop: number,
) => {
  const firstTop = getItems(list)[0]?.offsetTop ?? 0;
  return item.offsetTop - firstTop >= coveredRowTop;
};

const isSameRowLayout = (left: RowLayout | null, right: RowLayout | null) =>
  left?.coveredRowTop === right?.coveredRowTop &&
  left?.collapsedHeight === right?.collapsedHeight;

const CollapsibleTagList = ({
  toolbar,
  isExpanded,
  onExpandedChange,
  leadingItems,
  children,
  isHeightKept = false,
}: CollapsibleTagListProps) => {
  const unitRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [keptHeight, setKeptHeight] = useState<number | null>(null);
  const [rowLayout, setRowLayout] = useState<RowLayout | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const listID = useId();
  const hasLeadingItems = Children.toArray(leadingItems).length > 0;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let isActive = true;
    const measure = () => {
      if (!isActive) return;
      const items = getItems(list);
      const firstTop = items[0]?.offsetTop ?? 0;
      const rowStarts: HTMLElement[] = [];
      for (const item of items) {
        const previous = rowStarts.at(-1);
        if (!previous || item.offsetTop > previous.offsetTop) {
          rowStarts.push(item);
        }
        if (rowStarts.length > VISIBLE_ROW_COUNT) break;
      }
      const coveredRowStart = rowStarts[VISIBLE_ROW_COUNT - 1];
      const nextLayout =
        rowStarts.length > VISIBLE_ROW_COUNT && coveredRowStart
          ? {
              coveredRowTop: coveredRowStart.offsetTop - firstTop,
              collapsedHeight:
                coveredRowStart.offsetTop -
                firstTop +
                coveredRowStart.offsetHeight,
            }
          : null;
      setRowLayout((current) =>
        isSameRowLayout(current, nextLayout) ? current : nextLayout,
      );
      if (nextLayout) setKeptHeight(nextLayout.collapsedHeight);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    void document.fonts.ready.then(measure);
    measure();

    return () => {
      isActive = false;
      observer.disconnect();
    };
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || isExpanded) return;
    const measure = () => {
      setPanelHeight(panel.offsetHeight);
      setPanelWidth(panel.offsetWidth);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    measure();
    return () => observer.disconnect();
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (!isExpanded) return;
    const unit = unitRef.current;
    if (!unit) return;
    const measure = () => {
      const bounds = unit.getBoundingClientRect();
      setPanelPosition({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(unit);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded || !rowLayout) return;

    const handleFocusIn = (event: FocusEvent) => {
      const list = listRef.current;
      const target = event.target;
      if (!list || !(target instanceof HTMLElement) || target === list) return;
      const item = getItems(list).find((candidate) =>
        candidate.contains(target),
      );
      if (item && isHiddenWhenCollapsed(list, item, rowLayout.coveredRowTop)) {
        returnFocusRef.current = expandButtonRef.current;
        onExpandedChange(true);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, [isExpanded, onExpandedChange, rowLayout]);

  useEffect(() => {
    if (!focusRequest) return;
    setFocusRequest(null);
    const list = listRef.current;
    if (!list || !rowLayout) return;
    const firstHiddenItem = getItems(list).find((item) =>
      isHiddenWhenCollapsed(list, item, rowLayout.coveredRowTop),
    );
    const focusTarget = firstHiddenItem?.matches("button")
      ? firstHiddenItem
      : firstHiddenItem?.querySelector("button");
    focusTarget?.focus();
  }, [focusRequest, rowLayout]);

  const handleClose = () => {
    onExpandedChange(false);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const unitStyle: CollapsibleTagListStyle = {
    "--tag-panel-top": `${panelPosition.top}px`,
    "--tag-panel-left": `${panelPosition.left}px`,
    "--tag-panel-width": `${panelPosition.width}px`,
    ...(panelHeight !== null && {
      "--tag-panel-kept-height": `${panelHeight}px`,
    }),
    ...(panelWidth !== null && {
      "--tag-panel-kept-width": `${panelWidth}px`,
    }),
    ...(rowLayout && {
      "--tag-covered-row-top": `${rowLayout.coveredRowTop}px`,
      "--tag-collapsed-height": `${rowLayout.collapsedHeight}px`,
    }),
    ...(isHeightKept &&
      keptHeight !== null && { "--tag-kept-height": `${keptHeight}px` }),
  };

  return (
    <div
      ref={unitRef}
      className={styles["tag-panel-unit"]}
      style={unitStyle}
      data-expanded={isExpanded ? "true" : "false"}
    >
      <Dialog
        isOpen={isExpanded}
        onClose={handleClose}
        returnFocusRef={returnFocusRef}
        className={styles["tag-dialog"]}
        aria-label="タグの選択"
        isBackdropPointer={(event) => event.target === event.currentTarget}
      >
        <div
          ref={panelRef}
          className={styles["panel"]}
          onFocusCapture={(event) => {
            if (!isExpanded) returnFocusRef.current = event.target;
          }}
        >
          <div className={styles["toolbar"]}>{toolbar}</div>
          <div
            className={styles["tag-list-unit"]}
            data-collapsible={rowLayout ? "true" : "false"}
            data-expanded={isExpanded ? "true" : "false"}
          >
            <div ref={listRef} id={listID} className={styles["tag-list"]}>
              {hasLeadingItems && (
                <div className={styles["leading-row"]}>{leadingItems}</div>
              )}
              {children}
            </div>
            {rowLayout && !isExpanded && (
              <button
                ref={(button) => {
                  expandButtonRef.current = button;
                  if (button && !returnFocusRef.current?.isConnected) {
                    returnFocusRef.current = button;
                  }
                }}
                type="button"
                className={styles["expand-button"]}
                aria-expanded={false}
                aria-controls={listID}
                onClick={() => {
                  onExpandedChange(true);
                  setFocusRequest("first-hidden-item");
                }}
              >
                <span className={styles["expand-label"]}>
                  すべてのタグ
                  <span className={styles["expand-icon"]} aria-hidden="true">
                    <ExpandMoreRoundedIcon fontSize="inherit" />
                  </span>
                </span>
              </button>
            )}
          </div>
          {isExpanded && (
            <Button
              variant="ghost"
              isIconOnly
              className={styles["close-button"]}
              icon={<CloseRoundedIcon />}
              aria-label="タグの展開を閉じる"
              aria-controls={listID}
              onClick={handleClose}
            />
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default CollapsibleTagList;
