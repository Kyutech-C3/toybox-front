import { useState } from "react";

import styles from "./index.module.css";

import VisibilityIcon from "@/shared/ui/VisibilityIcon";

import type { WorkVisibility } from "@/shared/types/work";

const VISIBILITY_FILTER_ITEMS: { value: WorkVisibility; label: string }[] = [
  { value: "public", label: "全体公開" },
  { value: "private", label: "限定公開" },
  { value: "draft", label: "下書き" },
];

const VisibilityFilter = () => {
  const [selectedVisibilities, setSelectedVisibilities] = useState<
    WorkVisibility[]
  >([]);

  const handleToggle = (visibility: WorkVisibility) => {
    setSelectedVisibilities((current) =>
      current.includes(visibility)
        ? current.filter((item) => item !== visibility)
        : [...current, visibility],
    );
  };

  return (
    <div className={styles["visibility-filter"]}>
      {VISIBILITY_FILTER_ITEMS.map((item) => (
        <button
          key={item.value}
          type="button"
          className={styles["visibility-button"]}
          aria-label={item.label}
          aria-pressed={selectedVisibilities.includes(item.value)}
          title={item.label}
          onClick={() => handleToggle(item.value)}
        >
          <VisibilityIcon visibility={item.value} />
        </button>
      ))}
    </div>
  );
};

export default VisibilityFilter;
