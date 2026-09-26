import { useEffect, useMemo, useState } from "react";

import { createTag } from "../../api/createTag";
import { deletePendingResources } from "../../api/deletePendingResources";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import useTagOptions from "@/features/Tag/hook/useTagOptions";
import useToast from "@/shared/ui/Toast/hook/useToast";
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
  handleCreateTag: (tagName: string) => Promise<boolean>;
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
  const editorSessionVersion = useWorkEditorStore(
    (state) => state.sessionVersion,
  );
  const authSessionVersion = useAuthStore((state) => state.sessionVersion);
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
  const { showToast } = useToast();
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: 編集・認証セッション変更時にローカル状態も破棄する
  useEffect(() => {
    setCreatedTagOptions([]);
    setRetryingTags([]);
  }, [editorSessionVersion, authSessionVersion]);

  const resolveTag = async (
    tagName: string,
    isCurrentRequest: () => boolean,
  ): Promise<{ tag: EditorTag; isCreated: boolean } | null> => {
    const normalizedName = tagName.toLowerCase();
    const existingTag = findTag(availableTags, normalizedName);
    if (existingTag) return { tag: existingTag, isCreated: false };

    const { accessToken, sessionVersion: authSessionVersion } =
      useAuthStore.getState();
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    if (!isCurrentRequest()) {
      if (useAuthStore.getState().sessionVersion === authSessionVersion) {
        void deletePendingResources(
          { assetIDs: [], tagIDs: [newTag.id] },
          accessToken,
        );
      }
      return null;
    }
    addCreatedTagID(newTag.id);
    setCreatedTagOptions((current) => [
      ...current,
      { id: newTag.id, name: newTag.name, work_count: 0 },
    ]);
    return { tag: newTag, isCreated: true };
  };

  const addTagByName = async (tagName: string): Promise<boolean> => {
    const normalizedName = normalizeTagNameInput(tagName).toLowerCase();
    if (normalizedName === "") return false;
    const isCreating = storeApi
      .getState()
      .creatingTagNames.some((name) => name.toLowerCase() === normalizedName);
    if (isCreating) return false;
    if (
      tags.some(
        (tag) =>
          normalizeTagNameInput(tag.name).toLowerCase() === normalizedName,
      )
    ) {
      return false;
    }
    addCreatingTagName(normalizedName);
    const isCurrentRequest = createRequestGuard();

    try {
      const result = await resolveTag(normalizedName, isCurrentRequest);
      if (!isCurrentRequest() || result === null) return false;
      const { tag, isCreated } = result;
      addTag({ id: tag.id, name: tag.name });
      removeFailedTagName(normalizedName);
      if (isCreated) {
        showToast({
          message: `タグ「${tag.name}」を作成しました`,
          severity: "success",
        });
      }
      return true;
    } catch {
      if (isCurrentRequest()) addFailedTagName(normalizedName);
      return false;
    } finally {
      if (isCurrentRequest()) removeCreatingTagName(normalizedName);
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
    const isCurrentRequest = createRequestGuard();
    setRetryingTags((prev) => [...prev, tagName]);
    try {
      await addTagByName(tagName);
    } finally {
      if (isCurrentRequest()) {
        setRetryingTags((prev) =>
          prev.filter((name) => name.toLowerCase() !== normalizedName),
        );
      }
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
