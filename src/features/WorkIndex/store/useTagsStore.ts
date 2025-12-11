import { create } from "zustand";

type TagsStoreProps = {
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
};

export const useTagsStore = create<TagsStoreProps>((set) => ({
  tags: [],
  addTag: (tag: string) => {
    set((state) => ({ tags: [...state.tags, tag] }));
  },
  removeTag: (index: number) =>
    set((state) => ({
      tags: state.tags.filter((_, i) => i !== index),
    })),
}));
