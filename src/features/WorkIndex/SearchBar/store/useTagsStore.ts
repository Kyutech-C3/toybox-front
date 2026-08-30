import { create } from "zustand";

import type { Tag } from "@/shared/types/work";

type TagsStore = {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagID: string) => void;
};

export const useTagsStore = create<TagsStore>((set) => ({
  tags: [],
  addTag: (tag: Tag) => {
    set((state) => ({ tags: [...state.tags, tag] }));
  },
  removeTag: (tagID: string) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== tagID),
    })),
}));
