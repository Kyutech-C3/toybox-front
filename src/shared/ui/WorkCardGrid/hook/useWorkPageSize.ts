import { useWorkPageSizeStore } from "../store/useWorkPageSizeStore";

type UseWorkPageSizeReturn = {
  itemsPerPage: number;
};

const useWorkPageSize = (): UseWorkPageSizeReturn => {
  const pageSize = useWorkPageSizeStore((state) => state.pageSize);

  return { itemsPerPage: pageSize };
};

export default useWorkPageSize;
