import { useEffect, useMemo, useRef, useState } from "react";

import { useTagsStore } from "../store/useTagsStore";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
import Dropdown from "@/shared/ui/Dropdown";

import type { Tag } from "@/shared/types/work";

export const SearchBar = () => {
  const { tags, addTag, removeTag } = useTagsStore();
  const [inputValue, setInputValue] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allTagOptions = [
    { id: "1", name: "JavaScript" },
    { id: "2", name: "TypeScript" },
    { id: "3", name: "React" },
    { id: "4", name: "Zustand" },
    { id: "5", name: "CSS" },
    { id: "6", name: "HTML" },
  ];

  const onSelect = (option: Tag) => {
    addTag(option);
    setFocused(false);
  };

  const options = useMemo(() => {
    if (!allTagOptions) return [];
    const lowerInput = inputValue.toLowerCase();
    return allTagOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(lowerInput) &&
        !tags.includes(option),
    );
  }, [inputValue, tags]);

  const onSubmit = () => {
    setFocused(false);
    setInputValue("");
    addTag(options[0]);
  };

  useEffect(() => {
    if (!focused) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [focused]);

  return (
    <form
      className={styles["search-bar-wrapper"]}
      onFocus={() => setFocused(true)}
      onSubmit={onSubmit}
    >
      <div className={styles["search-bar"]} ref={containerRef}>
        <span className={styles["input-dropdown-container"]}>
          <Dropdown<{ id: string; name: string }>
            options={options}
            onSelect={onSelect}
            isOpen={options.length > 0 && focused}
            position="bottom"
          />
        </span>
        <input
          type="text"
          placeholder="# タグで絞り込み"
          name="tag"
          className={styles["search-input"]}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div className={styles["tags-wrapper"]}>
        {tags.map((tag, id) => (
          <Batch key={`${tag}`} color="secondary" onClick={() => removeTag(id)}>
            {tag.name}
          </Batch>
        ))}
      </div>
    </form>
  );
};
