import { useState } from "react";

import styles from "./index.module.css";

import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";

const WorkDetailForm = () => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  return (
    <Paper>
      <div className={styles["work-detail-form-wrapper"]}>
        <Input heading="タイトル" value={title} onChange={setTitle} />
        <TagInput
          heading="タグ"
          tags={tags}
          addTag={(tag: string) => setTags((prev) => [...prev, tag])}
          removeTag={(index: number) =>
            setTags((prev) => prev.filter((_, i) => i !== index))
          }
        />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
