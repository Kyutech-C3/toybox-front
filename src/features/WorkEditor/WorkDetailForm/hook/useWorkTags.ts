import { useState } from "react";

import { createTag } from "../../api/createTag";
import { deletePendingResources } from "../../api/deletePendingResources";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
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
  const { createRequestGuard } = useEditorRequestGuard();
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

  const resolveTagID = async (
    tagName: string,
    isCurrentRequest: () => boolean,
  ): Promise<string | null> => {
    const normalizedName = tagName.toLowerCase();
    const existingID = findTag(allTagOptions.data, normalizedName)?.id;
    if (existingID) return existingID;

    const { accessToken, sessionVersion: authSessionVersion } =
      useAuthStore.getState();
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    if (!isCurrentRequest()) {
      if (useAuthStore.getState().sessionVersion !== authSessionVersion)
        return null;
      void deletePendingResources(
        { assetIDs: [], tagIDs: [newTag.id] },
        accessToken,
      );
      return null;
    }
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
    const isCurrentRequest = createRequestGuard();

    try {
      const tagID = await resolveTagID(tagName, isCurrentRequest);
      if (!isCurrentRequest() || tagID === null) return;
      addTag({ id: tagID, name: normalizedName });
      removeFailedTagName(tagName);
    } catch {
      if (isCurrentRequest()) addFailedTagName(tagName);
    } finally {
      if (isCurrentRequest()) removeCreatingTagName(tagName);
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
