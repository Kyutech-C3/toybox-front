import SegmentedControl from "@/shared/ui/SegmentedControl";

import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";
import type { SortOrder } from "../getWorkIndexSelection";

type SortOrderSwitchProps = {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
};

const SORT_ORDER_OPTIONS: SegmentedControlOption<SortOrder>[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

const SortOrderSwitch = ({ value, onChange }: SortOrderSwitchProps) => (
  <SegmentedControl
    options={SORT_ORDER_OPTIONS}
    value={value}
    onChange={onChange}
    ariaLabel="投稿日時の並び順"
  />
);

export default SortOrderSwitch;
