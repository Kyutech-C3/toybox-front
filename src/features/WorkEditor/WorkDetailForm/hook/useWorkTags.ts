import { useState } from "react";

import { createTag } from "../../api/createTag";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";
import useTagOptions from "./useTagOptions";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Tag } from "@/shared/types/work";
import type { EditorTag } from "../../types";

const TAG_ERROR_MESSAGE = "タグの作成に失敗しました。再試行してください。";

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
  const storeApi = useWorkEditorStoreApi();
  const failedTags = useWorkEditorStore((state) => state.failedTagNames);
  const addCreatingTagName = useWorkEditorStore(
    (state) => state.addCreatingTagName,
  );
  const removeCreatingTagName = useWorkEditorStore(
    (state) => state.removeCreatingTagName,
  );
  const addFailedTagName = useWorkEditorStore(
    (state) => state.addFailedTagName,
  );
  const removeFailedTagName = useWorkEditorStore(
    (state) => state.removeFailedTagName,
  );
  const addCreatedTagID = useWorkEditorStore((state) => state.addCreatedTagID);
  const allTagOptions = useTagOptions();

  const [retryingTags, setRetryingTags] = useState<string[]>([]);

  const resolveTagID = async (tagName: string): Promise<string> => {
    const normalizedName = tagName.toLowerCase();
    const existingID = findTag(allTagOptions.data, normalizedName)?.id;
    if (existingID) return existingID;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    addCreatedTagID(newTag.id);
    return newTag.id;
  };

  const addTagByName = async (tagName: string) => {
    const normalizedName = tagName.toLowerCase();
    const isCreating = storeApi
      .getState()
      .creatingTagNames.some((name) => name.toLowerCase() === normalizedName);
    if (isCreating) return;
    if (tags.some((tag) => tag.name.toLowerCase() === normalizedName)) return;
    addCreatingTagName(tagName);

    try {
      const tagID = await resolveTagID(tagName);
      addTag({ id: tagID, name: normalizedName });
      removeFailedTagName(tagName);
    } catch {
      addFailedTagName(tagName);
    } finally {
      removeCreatingTagName(tagName);
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

  return {
    tags,
    allTagOptions: allTagOptions.data.map((tag) => tag.name),
    failedTags,
    retryingTags,
    tagError: failedTags.length > 0 ? TAG_ERROR_MESSAGE : "",
    handleAddTag: addTagByName,
    handleRemoveTag: removeTag,
    handleRetryTag,
    handleRemoveFailedTag: removeFailedTagName,
  };
};

export default useWorkTags;
