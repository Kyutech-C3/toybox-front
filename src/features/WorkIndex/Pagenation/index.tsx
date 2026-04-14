import { useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Dropdown from "@/shared/ui/Dropdown";

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
  const [isLeftDropdownOpen, setIsLeftDropdownOpen] = useState(false);
  const [isRightDropdownOpen, setIsRightDropdownOpen] = useState(false);
  const leftDropdownRef = useRef<HTMLDivElement>(null);
  const rightDropdownRef = useRef<HTMLDivElement>(null);

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

  // 外側クリックで閉じる（左ドロップダウン）
  useEffect(() => {
    if (!isLeftDropdownOpen && !isRightDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        leftDropdownRef.current &&
        !leftDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLeftDropdownOpen(false);
      }
      if (
        rightDropdownRef.current &&
        !rightDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRightDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLeftDropdownOpen, isRightDropdownOpen]);

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

  const handlePageSelect = (page: number, dropdownId: "left" | "right") => {
    onPageChange(page);
    if (dropdownId === "left") {
      setIsLeftDropdownOpen(false);
    } else {
      setIsRightDropdownOpen(false);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles["pagination-wrapper"]}>
      <Button
        variant="primary"
        disabled={currentPage === 1}
        onClick={handlePrevious}
        ariaLabel="前のページ"
      >
        ＜
      </Button>

      <nav className={styles.pagination} aria-label="ページネーション">
        {pageNumbers.map((item) => {
          if (item.type === "dots") {
            const isOpen =
              item.id === "left" ? isLeftDropdownOpen : isRightDropdownOpen;
            const setIsOpen =
              item.id === "left"
                ? setIsLeftDropdownOpen
                : setIsRightDropdownOpen;
            const dropdownRef =
              item.id === "left" ? leftDropdownRef : rightDropdownRef;

            return (
              <div
                key={item.id}
                ref={dropdownRef}
                className={styles["dropdown-container"]}
              >
                <button
                  type="button"
                  className={styles["dropdown-trigger"]}
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="隠れたページを表示"
                  aria-expanded={isOpen}
                >
                  • • •
                </button>

                <Dropdown
                  isOpen={isOpen}
                  options={item.hiddenPages}
                  onSelect={(page) => handlePageSelect(page, item.id)}
                  selectedValues={[currentPage]}
                  position="top"
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
        disabled={currentPage === totalPages}
        onClick={handleNext}
        ariaLabel="次のページ"
      >
        ＞
      </Button>
    </div>
  );
};
