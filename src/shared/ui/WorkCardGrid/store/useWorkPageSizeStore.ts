import { create } from "zustand";

export const WORK_PAGE_SIZE_OPTIONS = [30, 45] as const;

export type WorkPageSize = (typeof WORK_PAGE_SIZE_OPTIONS)[number];

type WorkPageSizeStore = {
  pageSize: WorkPageSize;
  setPageSize: (pageSize: WorkPageSize) => void;
};

export const useWorkPageSizeStore = create<WorkPageSizeStore>()((set) => ({
  pageSize: WORK_PAGE_SIZE_OPTIONS[0],
  setPageSize: (pageSize) => {
    set({ pageSize });
  },
}));
