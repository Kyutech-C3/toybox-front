import { useState } from "react";

import { usePostWorkStore } from "../store/usePostWorkStore";
import useTagOptions from "./hook/useTagOptions";
import styles from "./index.module.css";

import ImageUpload from "@/features/WorkEditor/WorkDetailForm/ImageUpload";
import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";

import type { Tag } from "@/shared/types/work";

const WorkDetailForm = () => {
  const { title, setTitle, addTag, addNewTag, removeTag } = usePostWorkStore();

  const [tags, setTags] = useState<string[]>([]);
  const { addAsset } = usePostWorkStore();
  const allTagOptions = useTagOptions();

  const tagCheck = (tags: Tag[], newTag: string): string | null => {
    const foundTag = tags.find((tag) => tag.name === newTag);
    if (foundTag) {
      return foundTag.id;
    }
    return null;
  };

  return (
    <Paper>
      <div className={styles["work-detail-form-wrapper"]}>
        <Input heading="タイトル" value={title} onChange={setTitle} />
        <TagInput
          heading="タグ"
          tags={tags}
          addTag={(tag: string) => {
            if (tags.includes(tag.toLowerCase())) return;
            setTags((prev) => [...prev, tag.toLowerCase()]);
            const tagID = tagCheck(allTagOptions.data || [], tag);
            if (tagID) {
              addTag(tagID);
            } else {
              addNewTag(tag);
            }
          }}
          removeTag={(index: number) => removeTag(index)}
          allTagOptions={allTagOptions.data.map((tag) => tag.name)}
        />
        <ImageUpload
          onImageSelect={(file: File) => {
            addAsset(file);
          }}
        />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
