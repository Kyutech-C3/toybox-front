import { useState } from "react";

import { createTag } from "../api/createTag";
import { uploadAsset } from "../api/uploadAsset";
import { usePostWorkStore } from "../store/usePostWorkStore";
import useTagOptions from "./hook/useTagOptions";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import ImageUpload from "@/features/WorkEditor/WorkDetailForm/ImageUpload";
import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";

import type { Tag } from "@/shared/types/work";

const WorkDetailForm = () => {
  const { title, setTitle, addTagID, removeTagID } = usePostWorkStore();

  const [tags, setTags] = useState<string[]>([]);
  const allTagOptions = useTagOptions();

  const tagCheck = (tags: Tag[], newTag: string): string | null => {
    const foundTag = tags.find((tag) => tag.name === newTag);
    if (foundTag) {
      return foundTag.id;
    }
    return null;
  };

  const handleAddTag = async (tag: string) => {
    if (tags.includes(tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag.toLowerCase()]);
    const tagID = tagCheck(allTagOptions.data || [], tag);
    if (tagID) {
      addTagID(tagID);
    } else {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        throw new Error("No access token available");
      }
      const newTag = await createTag(tag, accessToken);
      if (!newTag.id) {
        throw new Error("Failed to create tag");
      }
      addTagID(newTag.id);
    }
  };

  const handleAssetSelect = async (file: File) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const response = await uploadAsset(file, accessToken);
    if (!response.id) {
      throw new Error("Failed to upload asset");
    }
    usePostWorkStore.getState().addAssetID(response.id);
  };

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
    removeTagID(index);
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
        <ImageUpload onImageSelect={handleAssetSelect} />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
