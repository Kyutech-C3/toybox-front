import useWorkGridColumns from "./useWorkGridColumns";

const ROWS_PER_PAGE = 7;
const MAX_ITEMS_PER_PAGE = 50;

type UseWorkGridPageSizeReturn = {
  itemsPerPage: number;
};

const useWorkGridPageSize = (): UseWorkGridPageSizeReturn => {
  const { columns } = useWorkGridColumns();

  return {
    itemsPerPage: Math.min(columns * ROWS_PER_PAGE, MAX_ITEMS_PER_PAGE),
  };
};

export default useWorkGridPageSize;
