import { create } from "zustand";

import type { Work } from "@/shared/types/work";

type WorksStoreProps = {
  works: Work[];
  tags: string[];
  setWorks: (works: Work[]) => void;
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
};

export const useWorksStore = create<WorksStoreProps>((set) => ({
  works: [],
  tags: [],
  setWorks: (works: Work[]) => set({ works }),
  addTag: (tag: string) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (index: number) =>
    set((state) => ({
      tags: state.tags.filter((_, i) => i !== index),
    })),
}));
