import { useWorksStore } from "../store/useWorksStore";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";

export const SearchBar = () => {
  const { tags, addTag, removeTag } = useWorksStore();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tag = formData.get("tag") as string;
    if (tag.trim() !== "") {
      addTag(tag.trim());
      e.currentTarget.reset();
    }
  };

  return (
    <form className={styles["search-bar-wrapper"]} onSubmit={onSubmit}>
      <div className={styles["search-bar"]}>
        <input
          type="text"
          placeholder="# タグで絞り込み"
          name="tag"
          className={styles["search-input"]}
        />
      </div>
      <div className={styles["tags-wrapper"]}>
        {tags.map((tag, id) => (
          <Batch key={`${tag}`} color="secondary" onClick={() => removeTag(id)}>
            {tag}
          </Batch>
        ))}
      </div>
    </form>
  );
};
