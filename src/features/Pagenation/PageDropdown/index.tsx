import { useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

interface PageDropdownProps {
  hiddenPages: number[];
  onPageSelect: (page: number) => void;
  currentPage: number;
}

export const PageDropdown = ({
  hiddenPages,
  onPageSelect,
  currentPage,
}: PageDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePageClick = (page: number) => {
    onPageSelect(page);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="隠れたページを表示"
        aria-expanded={isOpen}
      >
        • • •
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.scrollContainer}>
            {hiddenPages.map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.item} ${
                  page === currentPage ? styles.itemActive : ""
                }`}
                onClick={() => handlePageClick(page)}
                role="menuitem"
                aria-label={`ページ ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
