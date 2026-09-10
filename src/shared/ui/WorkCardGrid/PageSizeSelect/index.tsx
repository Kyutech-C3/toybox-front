import SegmentedControl from "../../SegmentedControl";
import {
  useWorkPageSizeStore,
  WORK_PAGE_SIZE_OPTIONS,
} from "../store/useWorkPageSizeStore";

import type { SegmentedControlOption } from "../../SegmentedControl";
import type { WorkPageSize } from "../store/useWorkPageSizeStore";

const PAGE_SIZE_SEGMENTS: SegmentedControlOption<string>[] =
  WORK_PAGE_SIZE_OPTIONS.map((option) => ({
    value: String(option),
    label: `${option}件`,
  }));

const PageSizeSelect = () => {
  const pageSize = useWorkPageSizeStore((state) => state.pageSize);
  const setPageSize = useWorkPageSizeStore((state) => state.setPageSize);

  return (
    <SegmentedControl
      options={PAGE_SIZE_SEGMENTS}
      value={String(pageSize)}
      onChange={(value) => setPageSize(Number(value) as WorkPageSize)}
      ariaLabel="1ページの表示件数"
    />
  );
};

export default PageSizeSelect;
