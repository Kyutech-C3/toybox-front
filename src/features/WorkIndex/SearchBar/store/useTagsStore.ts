import { create } from "zustand";

import type { Tag } from "@/shared/types/work";

type TagsStoreProps = {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (index: number) => void;
};

export const useTagsStore = create<TagsStoreProps>((set) => ({
  tags: [],
  addTag: (tag: Tag) => {
    set((state) => ({ tags: [...state.tags, tag] }));
  },
  removeTag: (index: number) =>
    set((state) => ({
      tags: state.tags.filter((_, i) => i !== index),
    })),
}));
