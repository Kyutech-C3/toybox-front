import {
  useWorkPageSizeStore,
  WORK_PAGE_SIZE_OPTIONS,
} from "../store/useWorkPageSizeStore";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

const PageSizeSelect = () => {
  const pageSize = useWorkPageSizeStore((state) => state.pageSize);
  const setPageSize = useWorkPageSizeStore((state) => state.setPageSize);

  return (
    <div className={styles["page-size-select"]}>
      <span className={styles["label"]}>表示件数</span>
      <div className={styles["options"]}>
        {WORK_PAGE_SIZE_OPTIONS.map((option) => (
          <Button
            key={option}
            isActive={option === pageSize}
            onClick={() => setPageSize(option)}
            ariaLabel={`1ページあたり${option}件で表示`}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PageSizeSelect;
