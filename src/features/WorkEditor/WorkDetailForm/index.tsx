import { useRef, useState } from "react";

import { createTag } from "../api/createTag";
import { uploadAsset } from "../api/uploadAsset";
import { usePostWorkStore } from "../store/usePostWorkStore";
import useTagOptions from "./hook/useTagOptions";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import AssetUpload from "@/features/WorkEditor/WorkDetailForm/AssetUpload";
import ImageUpload from "@/features/WorkEditor/WorkDetailForm/ImageUpload";
import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";
import UrlInput from "@/shared/ui/UrlInput";

import type { Tag } from "@/shared/types/work";
import type { TagInputTag } from "@/shared/ui/TagInput";

const MAX_URL_COUNT = 5;

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const WorkDetailForm = () => {
  const {
    title,
    setTitle,
    addTagID,
    removeTagID,
    addAssetID,
    removeAssetID,
    setThumbnailAssetID,
    beginUpload,
    finishUpload,
    urls,
    addUrl,
    removeUrl,
  } = usePostWorkStore();

  const [tags, setTags] = useState<TagInputTag[]>([]);
  const selectedTagNamesRef = useRef<Set<string>>(new Set());
  const allTagOptions = useTagOptions();

  const findTag = (tags: Tag[], tagName: string): Tag | undefined =>
    tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

  const handleAddTag = async (tag: string) => {
    const tagName = tag.toLowerCase();
    if (selectedTagNamesRef.current.has(tagName)) return;
    selectedTagNamesRef.current.add(tagName);

    try {
      let tagID = findTag(allTagOptions.data, tagName)?.id;
      if (!tagID) {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
          throw new Error("No access token available");
        }
        const newTag = await createTag(tag, accessToken);
        if (!newTag.id) {
          throw new Error("Failed to create tag");
        }
        tagID = newTag.id;
      }

      setTags((prev) => [...prev, { id: tagID, name: tagName }]);
      addTagID(tagID);
    } catch (error) {
      selectedTagNamesRef.current.delete(tagName);
      throw error;
    }
  };

  const handleUpload = async (file: File) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    beginUpload();
    try {
      const response = await uploadAsset(file, accessToken);
      if (!response.id) {
        throw new Error("Failed to upload asset");
      }
      return response.id;
    } finally {
      finishUpload();
    }
  };

  const handleThumbnailSelect = async (file: File) => {
    setThumbnailAssetID("");
    const assetID = await handleUpload(file);
    setThumbnailAssetID(assetID);
  };

  const handleAssetUpload = async (file: File) => {
    const assetID = await handleUpload(file);
    addAssetID(assetID);
    return assetID;
  };

  const handleRemoveTag = (tagID: string) => {
    const removedTag = tags.find((tag) => tag.id === tagID);
    if (removedTag) {
      selectedTagNamesRef.current.delete(removedTag.name);
    }
    setTags((prev) => prev.filter((tag) => tag.id !== tagID));
    removeTagID(tagID);
  };

  const [url, setUrl] = useState<string>("");
  const [urlErrorMessage, setUrlErrorMessage] = useState<string>("");

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setUrlErrorMessage("");
  };

  const validateUrl = (newUrl: string): string => {
    if (newUrl === "") {
      return "URLを入力してください";
    }
    if (!isAbsoluteHttpUrl(newUrl)) {
      return "http:// または https:// から始まるURLを入力してください";
    }
    if (urls.length >= MAX_URL_COUNT) {
      return `URLは最大${MAX_URL_COUNT}個まで登録できます`;
    }
    if (urls.includes(newUrl)) {
      return "このURLは既に登録されています";
    }
    return "";
  };

  const handleAddUrl = () => {
    const trimmedUrl = url.trim();
    const errorMessage = validateUrl(trimmedUrl);
    if (errorMessage !== "") {
      setUrlErrorMessage(errorMessage);
      return;
    }

    addUrl(trimmedUrl);
    setUrl("");
  };

  const handleRemoveUrl = (index: number) => {
    removeUrl(index);
    setUrlErrorMessage("");
  };

  return (
    <Paper>
      <div className={styles["work-detail-form-wrapper"]}>
        <Input heading="タイトル" value={title} onChange={setTitle} />
        <TagInput
          heading="タグ"
          tags={tags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          allTagOptions={allTagOptions.data.map((tag) => tag.name)}
        />
        <ImageUpload
          onImageSelect={handleThumbnailSelect}
          onRemove={() => setThumbnailAssetID("")}
        />
        <AssetUpload onUpload={handleAssetUpload} onRemove={removeAssetID} />
        <UrlInput
          heading="リンク"
          isOptional
          urls={urls}
          maxUrlCount={MAX_URL_COUNT}
          value={url}
          onChange={handleUrlChange}
          onAddUrl={handleAddUrl}
          onRemoveUrl={handleRemoveUrl}
          errorMessage={urlErrorMessage}
          placeholder="https://example.com"
        />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
