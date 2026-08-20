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
import type { TagInputTag } from "@/shared/ui/TagInput";

const WorkDetailForm = () => {
  const { title, setTitle, addTagID, removeTagID } = usePostWorkStore();

  const [tags, setTags] = useState<TagInputTag[]>([]);
  const allTagOptions = useTagOptions();

  const findTag = (tags: Tag[], tagName: string): Tag | undefined =>
    tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

  const handleAddTag = async (tag: string) => {
    const tagName = tag.toLowerCase();
    if (tags.some(({ name }) => name === tagName)) return;

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

  const handleRemoveTag = (tagID: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== tagID));
    removeTagID(tagID);
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
