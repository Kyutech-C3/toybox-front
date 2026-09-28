import SegmentedControl from "@/shared/ui/SegmentedControl";
import VisibilityIcon from "@/shared/ui/VisibilityIcon";

import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";
import type { VisibilityFilterValue } from "../getWorkIndexSelection";

type VisibilityFilterProps = {
  value: VisibilityFilterValue | null;
  onChange: (value: VisibilityFilterValue | null) => void;
};

const VISIBILITY_OPTIONS: SegmentedControlOption<VisibilityFilterValue>[] = [
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

const VisibilityFilter = ({ value, onChange }: VisibilityFilterProps) => (
  <SegmentedControl
    options={VISIBILITY_OPTIONS}
    value={value}
    onChange={onChange}
    onDeselect={() => onChange(null)}
    ariaLabel="公開範囲"
  />
);

export default VisibilityFilter;
