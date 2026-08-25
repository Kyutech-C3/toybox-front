import { useRef } from "react";

import { createTag } from "../../api/createTag";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";
import useTagOptions from "./useTagOptions";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Tag } from "@/shared/types/work";
import type { EditorTag } from "../../types";

type UseWorkTagsReturn = {
  tags: EditorTag[];
  allTagOptions: string[];
  handleAddTag: (tagName: string) => Promise<void>;
  handleRemoveTag: (tagID: string) => void;
};

const findTag = (tags: Tag[], tagName: string): Tag | undefined =>
  tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

const useWorkTags = (): UseWorkTagsReturn => {
  const tags = useWorkEditorStore((state) => state.current.tags);
  const addTag = useWorkEditorStore((state) => state.addTag);
  const removeTag = useWorkEditorStore((state) => state.removeTag);
  const allTagOptions = useTagOptions();
  // 同じタグ名の追加処理が同時に走らないようにする（作成 API が二重に呼ばれるため）
  const pendingTagNamesRef = useRef<Set<string>>(new Set());

  const handleAddTag = async (tagName: string) => {
    const normalizedName = tagName.toLowerCase();
    if (pendingTagNamesRef.current.has(normalizedName)) return;
    if (tags.some((tag) => tag.name.toLowerCase() === normalizedName)) return;
    pendingTagNamesRef.current.add(normalizedName);

    try {
      let tagID = findTag(allTagOptions.data, normalizedName)?.id;
      if (!tagID) {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
          throw new Error("No access token available");
        }
        const newTag = await createTag(tagName, accessToken);
        tagID = newTag.id;
      }
      addTag({ id: tagID, name: normalizedName });
    } finally {
      pendingTagNamesRef.current.delete(normalizedName);
    }
  };

  return {
    tags,
    allTagOptions: allTagOptions.data.map((tag) => tag.name),
    handleAddTag,
    handleRemoveTag: removeTag,
  };
};

export default useWorkTags;
