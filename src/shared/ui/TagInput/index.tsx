import { useEffect, useMemo, useRef, useState } from "react";

import Batch from "../Batch";
import Dropdown from "../Dropdown";
import styles from "./index.module.css";

import type { FormEvent, InputHTMLAttributes } from "react";

export type TagInputTag = {
  id: string;
  name: string;
};

type TagInputProps = {
  tags: TagInputTag[];
  allTagOptions?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tagID: string) => void;
  heading?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const TagInput = ({
  tags,
  allTagOptions,
  onAddTag,
  onRemoveTag,
  heading,
  ...props
}: TagInputProps) => {
  const [isFocused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tag = inputValue.trim();
    if (tag !== "") {
      if (tags.some(({ name }) => name.toLowerCase() === tag.toLowerCase())) {
        return;
      }
      onAddTag(tag);
      setInputValue("");
    }
  };

  useEffect(() => {
    if (!isFocused) return;

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
  }, [isFocused]);

  const options = useMemo(() => {
    if (!allTagOptions) return [];
    const lowerInput = inputValue.toLowerCase();
    return allTagOptions.filter(
      (option) =>
        option.toLowerCase().includes(lowerInput) &&
        !tags.some(({ name }) => name.toLowerCase() === option.toLowerCase()),
    );
  }, [inputValue, allTagOptions, tags]);

  return (
    <form className={styles["tag-input-wrapper"]} onSubmit={handleSubmit}>
      {heading && <h3>{heading}</h3>}
      <div ref={containerRef} className={styles["input-wrapper"]}>
        <div className={styles["tags-wrapper"]}>
          {tags.map((tag) => (
            <Batch
              key={tag.id}
              color="primary"
              onClick={() => {
                onRemoveTag(tag.id);
              }}
            >
              {tag.name}
            </Batch>
          ))}
          <span className={styles["input-dropdown-container"]}>
            <Dropdown
              isOpen={options.length > 0 && isFocused}
              options={options}
              position="bottom"
              onSelect={(tag) => {
                if (
                  tags.some(
                    ({ name }) => name.toLowerCase() === tag.toLowerCase(),
                  )
                ) {
                  return;
                }
                onAddTag(tag);
                setInputValue("");
                setFocused(false);
              }}
            />
          </span>
          <input
            type="text"
            name="tag"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setFocused(true);
            }}
            className={styles["input-field"]}
            {...props}
          />
        </div>
      </div>
    </form>
  );
};

export default TagInput;
