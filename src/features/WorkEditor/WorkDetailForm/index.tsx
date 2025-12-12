import { useState } from "react";

import { uploadAsset } from "../api/uploadAsset";
import { usePostWorkStore } from "../store/usePostWorkStore";
import styles from "./index.module.css";

import ImageUpload from "@/features/WorkEditor/WorkDetailForm/ImageUpload";
import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";

const WorkDetailForm = () => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { addAsset } = usePostWorkStore();

  // TODO: タグ候補はAPIから取得するようにする
  const allTagOptions = ["React", "TypeScript", "JavaScript", "CSS", "HTML"];

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
          }}
          removeTag={(index: number) =>
            setTags((prev) => prev.filter((_, i) => i !== index))
          }
          allTagOptions={allTagOptions}
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
