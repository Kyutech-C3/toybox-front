import { useId, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Listbox from "@/shared/ui/Listbox";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

type PageItem =
  | { type: "page"; value: number }
  | { type: "dots"; id: "left" | "right"; hiddenPages: number[] };

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 3,
}: PaginationProps) => {
  const [isLeftListboxOpen, setIsLeftListboxOpen] = useState(false);
  const [isRightListboxOpen, setIsRightListboxOpen] = useState(false);
  const leftListboxRef = useRef<HTMLButtonElement>(null);
  const rightListboxRef = useRef<HTMLButtonElement>(null);
  const paginationID = useId();

  // ページ番号の配列を生成
  const getPageNumbers = (): PageItem[] => {
    const pages: PageItem[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push({ type: "page", value: i });
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      }
      if (currentPage + halfVisible >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      if (startPage > 1) {
        pages.push({ type: "page", value: 1 });
        if (startPage > 2) {
          const hiddenPages = Array.from(
            { length: startPage - 2 },
            (_, i) => i + 2,
          );
          pages.push({ type: "dots", id: "left", hiddenPages });
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push({ type: "page", value: i });
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const hiddenPages = Array.from(
            { length: totalPages - endPage - 1 },
            (_, i) => endPage + i + 1,
          );
          pages.push({ type: "dots", id: "right", hiddenPages });
        }
        pages.push({ type: "page", value: totalPages });
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number, side: "left" | "right") => {
    onPageChange(page);
    if (side === "left") {
      setIsLeftListboxOpen(false);
    } else {
      setIsRightListboxOpen(false);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles["pagination-wrapper"]}>
      <Button
        variant="primary"
        isDisabled={currentPage === 1}
        onClick={handlePrevious}
        ariaLabel="前のページ"
      >
        <ChevronLeftRoundedIcon fontSize="small" aria-hidden="true" />
      </Button>

      <nav className={styles["pagination"]} aria-label="ページネーション">
        {pageNumbers.map((item) => {
          if (item.type === "dots") {
            const isOpen =
              item.id === "left" ? isLeftListboxOpen : isRightListboxOpen;
            const setIsOpen =
              item.id === "left" ? setIsLeftListboxOpen : setIsRightListboxOpen;
            const listboxRef =
              item.id === "left" ? leftListboxRef : rightListboxRef;
            const listboxID = `${paginationID}-${item.id}`;

            return (
              <div key={item.id} className={styles["listbox-container"]}>
                <button
                  type="button"
                  className={styles["listbox-trigger"]}
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="隠れたページを表示"
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  aria-controls={listboxID}
                  ref={listboxRef}
                >
                  • • •
                </button>

                <Listbox
                  id={listboxID}
                  isOpen={isOpen}
                  options={item.hiddenPages.map((page) => ({
                    id: page,
                    value: page,
                    label: String(page),
                  }))}
                  onClose={() => setIsOpen(false)}
                  triggerRef={listboxRef}
                  onSelect={(page) => handlePageSelect(page, item.id)}
                  selectedValue={currentPage}
                  textAlign="center"
                  ariaLabel="ページ番号"
                  className={styles["page-listbox"]}
                />
              </div>
            );
          }

          return (
            <Button
              key={item.value}
              variant="primary"
              isActive={item.value === currentPage}
              onClick={() => onPageChange(item.value)}
              ariaLabel={`ページ ${item.value}`}
            >
              {item.value}
            </Button>
          );
        })}
      </nav>

      <Button
        variant="primary"
        isDisabled={currentPage === totalPages}
        onClick={handleNext}
        ariaLabel="次のページ"
      >
        <ChevronRightRoundedIcon fontSize="small" aria-hidden="true" />
      </Button>
    </div>
  );
};
