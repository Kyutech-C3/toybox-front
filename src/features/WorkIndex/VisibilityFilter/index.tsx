import { useState } from "react";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";

import styles from "./index.module.css";

import SegmentedControl from "@/shared/ui/SegmentedControl";
import VisibilityIcon from "@/shared/ui/VisibilityIcon";

import type { WorkVisibility } from "@/shared/types/work";
import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";

type VisibilityFilterValue = "all" | WorkVisibility;

const VISIBILITY_FILTER_OPTIONS: SegmentedControlOption<VisibilityFilterValue>[] =
  [
    {
      value: "all",
      label: "すべて",
      icon: (
        <span className={styles["filter-icon"]}>
          <AppsRoundedIcon fontSize="inherit" />
        </span>
      ),
      isLabelVisible: false,
    },
    {
      value: "public",
      label: "全体公開",
      icon: <VisibilityIcon visibility="public" />,
      isLabelVisible: false,
    },
    {
      value: "private",
      label: "限定公開",
      icon: <VisibilityIcon visibility="private" />,
      isLabelVisible: false,
    },
    {
      value: "draft",
      label: "下書き",
      icon: <VisibilityIcon visibility="draft" />,
      isLabelVisible: false,
    },
  ];

const VisibilityFilter = () => {
  const [visibility, setVisibility] = useState<VisibilityFilterValue>("all");

  return (
    <SegmentedControl
      options={VISIBILITY_FILTER_OPTIONS}
      value={visibility}
      onChange={setVisibility}
      ariaLabel="公開状態で絞り込み"
    />
  );
};

export default VisibilityFilter;
