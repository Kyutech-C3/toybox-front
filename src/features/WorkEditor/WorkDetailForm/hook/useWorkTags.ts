import { useEffect, useRef, useState } from "react";

import { createTag } from "../../api/createTag";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";
import useTagOptions from "./useTagOptions";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Tag } from "@/shared/types/work";
import type { EditorTag } from "../../types";

type UseWorkTagsReturn = {
  tags: EditorTag[];
  allTagOptions: string[];
  failedTags: string[];
  retryingTags: string[];
  tagError: string;
  handleAddTag: (tagName: string) => Promise<void>;
  handleRemoveTag: (tagID: string) => void;
  handleRetryTag: (tagName: string) => Promise<void>;
  handleRemoveFailedTag: (tagName: string) => void;
};

const findTag = (tags: Tag[], tagName: string): Tag | undefined =>
  tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

const useWorkTags = (): UseWorkTagsReturn => {
  const tags = useWorkEditorStore((state) => state.current.tags);
  const addTag = useWorkEditorStore((state) => state.addTag);
  const removeTag = useWorkEditorStore((state) => state.removeTag);
  const allTagOptions = useTagOptions();

  const pendingTagNamesRef = useRef<Set<string>>(new Set());
  const [failedTags, setFailedTags] = useState<string[]>([]);
  const [retryingTags, setRetryingTags] = useState<string[]>([]);
  const [tagError, setTagError] = useState("");

  useEffect(() => {
    if (failedTags.length === 0) setTagError("");
  }, [failedTags]);

  const resolveTagID = async (tagName: string): Promise<string> => {
    const normalizedName = tagName.toLowerCase();
    const existingID = findTag(allTagOptions.data, normalizedName)?.id;
    if (existingID) return existingID;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    return newTag.id;
  };

  const addTagByName = async (tagName: string) => {
    const normalizedName = tagName.toLowerCase();
    if (pendingTagNamesRef.current.has(normalizedName)) return;
    if (tags.some((tag) => tag.name.toLowerCase() === normalizedName)) return;
    pendingTagNamesRef.current.add(normalizedName);

    try {
      const tagID = await resolveTagID(tagName);
      addTag({ id: tagID, name: normalizedName });
      setFailedTags((prev) =>
        prev.filter((name) => name.toLowerCase() !== normalizedName),
      );
    } catch {
      setFailedTags((prev) =>
        prev.some((name) => name.toLowerCase() === normalizedName)
          ? prev
          : [...prev, tagName],
      );
      setTagError("タグの作成に失敗しました。再試行してください。");
    } finally {
      pendingTagNamesRef.current.delete(normalizedName);
    }
  };

  const handleRetryTag = async (tagName: string) => {
    const normalizedName = tagName.toLowerCase();
    if (retryingTags.some((name) => name.toLowerCase() === normalizedName)) {
      return;
    }
    setRetryingTags((prev) => [...prev, tagName]);
    try {
      await addTagByName(tagName);
    } finally {
      setRetryingTags((prev) =>
        prev.filter((name) => name.toLowerCase() !== normalizedName),
      );
    }
  };

  const handleRemoveFailedTag = (tagName: string) => {
    const normalizedName = tagName.toLowerCase();
    setFailedTags((prev) =>
      prev.filter((name) => name.toLowerCase() !== normalizedName),
    );
  };

  return {
    tags,
    allTagOptions: allTagOptions.data.map((tag) => tag.name),
    failedTags,
    retryingTags,
    tagError,
    handleAddTag: addTagByName,
    handleRemoveTag: removeTag,
    handleRetryTag,
    handleRemoveFailedTag,
  };
};

export default useWorkTags;
