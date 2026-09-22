import { useSearchParams } from "react-router-dom";

import { useTagsStore } from "../SearchBar/store/useTagsStore";
import { getWorksSWRKey } from "./useWorks";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useWorkPageSizeStore } from "@/shared/ui/WorkCardGrid/store/useWorkPageSizeStore";

import type { Tag } from "@/shared/types/work";

type UseWorkIndexRequestReturn = {
  accessToken: string | null;
  currentPage: number;
  itemsPerPage: number;
  swrKey: ReturnType<typeof getWorksSWRKey>;
  tags: Tag[];
};

const useWorkIndexRequest = (): UseWorkIndexRequestReturn => {
  const [searchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tags = useTagsStore((state) => state.tags);
  const itemsPerPage = useWorkPageSizeStore((state) => state.pageSize);
  const currentPage = Number(searchParams.get("page")) || 1;

  return {
    accessToken,
    currentPage,
    itemsPerPage,
    swrKey: getWorksSWRKey({
      page: currentPage,
      limit: itemsPerPage,
      tags,
      accessToken,
    }),
    tags,
  };
};

export default useWorkIndexRequest;
