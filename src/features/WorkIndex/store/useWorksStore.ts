import { create } from "zustand";

type WorksStoreProps = {
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
};

export const useWorksStore = create<WorksStoreProps>((set) => ({
  tags: [],
  addTag: (tag: string) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (index: number) =>
    set((state) => ({
      tags: state.tags.filter((_, i) => i !== index),
    })),
}));
