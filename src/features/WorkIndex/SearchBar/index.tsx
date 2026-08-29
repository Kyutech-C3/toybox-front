import { useId, useMemo, useRef, useState } from "react";

import useTagOptions from "./hook/useTagOptions";
import styles from "./index.module.css";
import { useTagsStore } from "./store/useTagsStore";

import Batch from "@/shared/ui/Batch";
import Listbox from "@/shared/ui/Listbox";

import type { Tag } from "@/shared/types/work";
import type { ListboxOption } from "@/shared/ui/Listbox";

export const SearchBar = () => {
  const { tags, addTag, removeTag } = useTagsStore();
  const [inputValue, setInputValue] = useState<string>("");
  const [isFocused, setFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagListboxID = useId();
  const { data: allTagOptions } = useTagOptions();

  const handleSelect = (option: Tag) => {
    addTag(option);
    setFocused(false);
  };

  const tagOptions = useMemo<ListboxOption<Tag>[]>(() => {
    if (!allTagOptions) return [];

    const lowerInput = inputValue.toLowerCase();
    return allTagOptions
      .filter(
        (tag) =>
          tag.name.toLowerCase().includes(lowerInput) &&
          !tags.some((selectedTag) => selectedTag.id === tag.id),
      )
      .map((tag) => ({ id: tag.id, value: tag, label: tag.name }));
  }, [inputValue, tags, allTagOptions]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFocused(false);
    setInputValue("");
    if (tagOptions.length > 0) {
      addTag(tagOptions[0].value);
    }
  };

  return (
    <>
      <form
        className={styles["search-bar-wrapper"]}
        onFocus={() => setFocused(true)}
        onSubmit={handleSubmit}
      >
        <div className={styles["search-bar"]}>
          <span className={styles["input-listbox-container"]}>
            <Listbox
              id={tagListboxID}
              options={tagOptions}
              onSelect={handleSelect}
              onClose={() => setFocused(false)}
              triggerRef={inputRef}
              isOpen={tagOptions.length > 0 && isFocused}
              placement="bottom"
              align="start"
              ariaLabel="タグ候補"
              className={styles["tag-listbox"]}
            />
          </span>
          <input
            type="text"
            role="combobox"
            placeholder="# タグで絞り込み"
            name="tag"
            className={styles["search-input"]}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-haspopup="listbox"
            aria-expanded={tagOptions.length > 0 && isFocused}
            aria-controls={tagListboxID}
            aria-autocomplete="list"
            ref={inputRef}
          />
        </div>
      </form>
      <div className={styles["tags-wrapper"]}>
        {tags.map((tag) => (
          <Batch
            key={tag.id}
            color="secondary"
            onClick={() => removeTag(tag.id)}
          >
            {tag.name}
          </Batch>
        ))}
      </div>
    </>
  );
};
