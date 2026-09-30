import PageSizeSelect from "../PageSizeSelect";
import styles from "./index.module.css";

import type { ReactNode } from "react";

type WorkListControlsProps = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPagePositionClick?: () => void;
  filterControls?: ReactNode;
  sortControl?: ReactNode;
};

const WorkListControls = ({
  totalCount,
  currentPage,
  totalPages,
  onPagePositionClick,
  filterControls,
  sortControl,
}: WorkListControlsProps) => {
  const pagePosition = `${currentPage}ページ目 / 全${totalPages}ページ`;

  return (
    <div className={styles["work-list-controls"]}>
      <div className={styles["leading-controls"]}>
        <p className={styles["result-count"]}>
          <span className={styles["result-count-number"]}>{totalCount}</span>件
        </p>
        {filterControls}
      </div>
      <div className={styles["trailing-controls"]}>
        {totalPages > 1 && (
          <button
            type="button"
            className={styles["page-position"]}
            onClick={onPagePositionClick}
            aria-label={`${pagePosition}。ページ送りへ移動`}
          >
            {pagePosition}
          </button>
        )}
        {sortControl}
        <PageSizeSelect />
      </div>
    </div>
  );
};

export default WorkListControls;
