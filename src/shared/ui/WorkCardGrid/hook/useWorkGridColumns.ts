import { useEffect, useState } from "react";

const FALLBACK_COLUMN_COUNT = 3;
const RESIZE_DEBOUNCE_MS = 200;

type UseWorkGridColumnsReturn = {
  columns: number;
};

const readColumnCount = (): number => {
  if (typeof window === "undefined") {
    return FALLBACK_COLUMN_COUNT;
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const readNumber = (name: string, fallback: number) => {
    const value = Number.parseFloat(rootStyle.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const fixedColumns = readNumber("--card-columns", 0);
  if (fixedColumns > 0) {
    return fixedColumns;
  }

  const cardMinWidth = readNumber("--card-min-width", 0);
  if (cardMinWidth <= 0) {
    return FALLBACK_COLUMN_COUNT;
  }

  const pageMargin = readNumber("--page-margin", 0);
  const gridGap = readNumber("--grid-gap", 0);
  const maxColumns = readNumber("--card-max-columns", FALLBACK_COLUMN_COUNT);
  const contentWidthRatio = readNumber("--content-width-ratio", 1);
  const availableWidth = Math.min(
    document.documentElement.clientWidth - pageMargin * 2,
    window.innerWidth * contentWidthRatio,
  );
  const columns = Math.floor(
    (availableWidth + gridGap) / (cardMinWidth + gridGap),
  );

  return Math.min(Math.max(columns, 1), maxColumns);
};

const useWorkGridColumns = (): UseWorkGridColumnsReturn => {
  const [columns, setColumns] = useState(readColumnCount);

  useEffect(() => {
    let timeoutID: number | undefined;

    const handleResize = () => {
      window.clearTimeout(timeoutID);
      timeoutID = window.setTimeout(() => {
        setColumns(readColumnCount());
      }, RESIZE_DEBOUNCE_MS);
    };

    setColumns(readColumnCount());
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(timeoutID);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { columns };
};

export default useWorkGridColumns;
