import { useState } from "react";

import SegmentedControl from "@/shared/ui/SegmentedControl";
import VisibilityIcon from "@/shared/ui/VisibilityIcon";

import type { WorkVisibility } from "@/shared/types/work";
import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";

type VisibilityOption = Extract<WorkVisibility, "public" | "private">;

const VISIBILITY_OPTIONS: SegmentedControlOption<VisibilityOption>[] = [
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
];

const VisibilityFilter = () => {
  const [selectedVisibility, setSelectedVisibility] =
    useState<VisibilityOption | null>(null);

  return (
    <SegmentedControl
      options={VISIBILITY_OPTIONS}
      value={selectedVisibility}
      onChange={setSelectedVisibility}
      onDeselect={() => setSelectedVisibility(null)}
      ariaLabel="公開範囲"
    />
  );
};

export default VisibilityFilter;
