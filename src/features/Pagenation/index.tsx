import styles from "./index.module.css";
import { PageDropdown } from "./PageDropdown";
import { PagenationButton } from "./PagenationButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

type PageItem =
  | { type: "page"; value: number }
  | { type: "dots"; hiddenPages: number[] };

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 3,
}: PaginationProps) => {
  // ページ番号の配列を生成
  const getPageNumbers = (): PageItem[] => {
    const pages: PageItem[] = [];

    if (totalPages <= maxVisiblePages) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push({ type: "page", value: i });
      }
    } else {
      // 省略表示を含むページ番号を生成
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // 開始ページの調整
      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      }
      // 終了ページの調整
      if (currentPage + halfVisible >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      // 最初のページ
      if (startPage > 1) {
        pages.push({ type: "page", value: 1 });
        if (startPage > 2) {
          // 隠れたページ番号を計算
          const hiddenPages = Array.from(
            { length: startPage - 2 },
            (_, i) => i + 2,
          );
          pages.push({ type: "dots", hiddenPages });
        }
      }

      // 中間のページ
      for (let i = startPage; i <= endPage; i++) {
        pages.push({ type: "page", value: i });
      }

      // 最後のページ
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          // 隠れたページ番号を計算
          const hiddenPages = Array.from(
            { length: totalPages - endPage - 1 },
            (_, i) => endPage + i + 1,
          );
          pages.push({ type: "dots", hiddenPages });
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

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles["pagination-wrapper"]}>
      {/* 前へボタン */}
      <PagenationButton
        variant="nav"
        disabled={currentPage === 1}
        onClick={handlePrevious}
        ariaLabel="前のページ"
      >
        ＜
      </PagenationButton>

      {/* ページ番号 */}
      <nav className={styles.pagination} aria-label="ページネーション">
        {pageNumbers.map((item) => {
          if (item.type === "dots") {
            // 隠れたページの範囲から一意なキーを生成
            const key = `dots-${item.hiddenPages[0]}-${item.hiddenPages[item.hiddenPages.length - 1]}`;
            return (
              <PageDropdown
                key={key}
                hiddenPages={item.hiddenPages}
                onPageSelect={onPageChange}
                currentPage={currentPage}
              />
            );
          }

          return (
            <PagenationButton
              key={item.value}
              variant="page"
              active={item.value === currentPage}
              onClick={() => onPageChange(item.value)}
              ariaLabel={`ページ ${item.value}`}
            >
              {item.value}
            </PagenationButton>
          );
        })}
      </nav>

      {/* 次へボタン */}
      <PagenationButton
        variant="nav"
        disabled={currentPage === totalPages}
        onClick={handleNext}
        ariaLabel="次のページ"
      >
        ＞
      </PagenationButton>
    </div>
  );
};
