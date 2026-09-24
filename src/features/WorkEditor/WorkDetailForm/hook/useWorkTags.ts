import { useMemo, useState } from "react";

import { createTag } from "../../api/createTag";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import useTagOptions from "@/features/Tag/hook/useTagOptions";
import { normalizeTagNameInput } from "@/util/tagName";

import type { TagSelectorOption } from "@/shared/ui/TagSelector";
import type { EditorTag } from "../../types";

const TAG_ERROR_MESSAGE = "タグの作成に失敗しました。再試行してください。";

type UseWorkTagsReturn = {
  tags: EditorTag[];
  allTagOptions: TagSelectorOption[];
  failedTags: string[];
  retryingTags: string[];
  tagError: string;
  handleAddTag: (tagID: string) => void;
  handleCreateTag: (tagName: string) => Promise<void>;
  handleRemoveTag: (tagID: string) => void;
  handleRetryTag: (tagName: string) => Promise<void>;
  handleRemoveFailedTag: (tagName: string) => void;
};

const findTag = <T extends { id: string; name: string }>(
  tags: T[],
  tagName: string,
): T | undefined =>
  tags.find(
    (tag) =>
      normalizeTagNameInput(tag.name).toLowerCase() === tagName.toLowerCase(),
  );

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
  const [createdTagOptions, setCreatedTagOptions] = useState<
    TagSelectorOption[]
  >([]);
  const availableTags = useMemo(
    () => [
      ...allTagOptions.data,
      ...createdTagOptions.filter(
        (created) =>
          !allTagOptions.data.some((option) => option.id === created.id),
      ),
    ],
    [allTagOptions.data, createdTagOptions],
  );

  const [retryingTags, setRetryingTags] = useState<string[]>([]);

  const resolveTag = async (tagName: string): Promise<EditorTag> => {
    const normalizedName = tagName.toLowerCase();
    const existingTag = findTag(availableTags, normalizedName);
    if (existingTag) return existingTag;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    addCreatedTagID(newTag.id);
    setCreatedTagOptions((current) => [
      ...current,
      { id: newTag.id, name: newTag.name, work_count: 0 },
    ]);
    return newTag;
  };

  const addTagByName = async (tagName: string) => {
    const normalizedName = normalizeTagNameInput(tagName).toLowerCase();
    if (normalizedName === "") return;
    const isCreating = storeApi
      .getState()
      .creatingTagNames.some((name) => name.toLowerCase() === normalizedName);
    if (isCreating) return;
    if (
      tags.some(
        (tag) =>
          normalizeTagNameInput(tag.name).toLowerCase() === normalizedName,
      )
    ) {
      return;
    }
    addCreatingTagName(normalizedName);

    try {
      const tag = await resolveTag(normalizedName);
      addTag({ id: tag.id, name: tag.name });
      removeFailedTagName(normalizedName);
    } catch {
      addFailedTagName(normalizedName);
    } finally {
      removeCreatingTagName(normalizedName);
    }
  };

  const handleAddTag = (tagID: string) => {
    const tag = availableTags.find((option) => option.id === tagID);
    if (tag) addTag({ id: tag.id, name: tag.name });
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
    allTagOptions: availableTags,
    failedTags,
    retryingTags,
    tagError: failedTags.length > 0 ? TAG_ERROR_MESSAGE : "",
    handleAddTag,
    handleCreateTag: addTagByName,
    handleRemoveTag: removeTag,
    handleRetryTag,
    handleRemoveFailedTag: removeFailedTagName,
  };
};

export default useWorkTags;
