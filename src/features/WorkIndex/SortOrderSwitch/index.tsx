import { useState } from "react";

import SegmentedControl from "@/shared/ui/SegmentedControl";

import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";

type SortOrder = "newest" | "oldest";

const SORT_ORDER_OPTIONS: SegmentedControlOption<SortOrder>[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

const SortOrderSwitch = () => {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  return (
    <SegmentedControl
      options={SORT_ORDER_OPTIONS}
      value={sortOrder}
      onChange={setSortOrder}
      ariaLabel="投稿日時の並び順"
    />
  );
};

export default SortOrderSwitch;
