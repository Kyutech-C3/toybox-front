import Batch from "../Batch";
import styles from "./index.module.css";

import type { InputHTMLAttributes } from "react";

type TagInputProps = {
  tags: string[];
  allTagOptions?: string[];
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
  heading?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const TagInput = ({
  tags,
  addTag,
  removeTag,
  heading,
  ...props
}: TagInputProps) => {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tag = formData.get("tag") as string;
    if (tag.trim() !== "") {
      if (tags.includes(tag.trim().toUpperCase())) return;
      addTag(tag.trim().toUpperCase());
      e.currentTarget.reset();
    }
  };

  return (
    <form className={styles["tag-input-wrapper"]} onSubmit={onSubmit}>
      {heading && <h3>{heading}</h3>}
      <div className={styles["input-wrapper"]}>
        <div className={styles["tags-wrapper"]}>
          {tags.map((tag, id) => (
            <Batch key={`${tag}`} color="primary" onClick={() => removeTag(id)}>
              {tag}
            </Batch>
          ))}
          <input
            type="text"
            name="tag"
            className={styles["input-field"]}
            {...props}
          />
        </div>
      </div>
    </form>
  );
};

export default TagInput;
