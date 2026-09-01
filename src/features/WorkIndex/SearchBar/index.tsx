import { useCallback } from "react";

import useTagOptions from "./hook/useTagOptions";
import styles from "./index.module.css";
import { useTagsStore } from "./store/useTagsStore";

import TagInput from "@/shared/ui/TagInput";

export const SearchBar = () => {
  const { tags, addTag, removeTag } = useTagsStore();
  const { data: allTagOptions } = useTagOptions();

  // 検索は既存タグの絞り込みなので、候補に無い入力は追加しない
  const handleAddTag = useCallback(
    (tagName: string) => {
      const lowerName = tagName.toLowerCase();
      const matchedTag =
        allTagOptions.find((tag) => tag.name.toLowerCase() === lowerName) ??
        allTagOptions.find((tag) => tag.name.toLowerCase().includes(lowerName));

      if (!matchedTag) return;
      if (tags.some((selectedTag) => selectedTag.id === matchedTag.id)) return;

      addTag(matchedTag);
    },
    [addTag, allTagOptions, tags],
  );

  return (
    <div className={styles["search-bar-wrapper"]}>
      <TagInput
        tags={tags}
        allTagOptions={allTagOptions.map((tag) => tag.name)}
        onAddTag={handleAddTag}
        onRemoveTag={removeTag}
        placeholder="タグで絞り込み"
        aria-label="タグで絞り込み"
      />
    </div>
  );
};
