import { useEffect, useMemo, useRef, useState } from "react";

import Batch from "../Batch";
import Dropdown from "../Dropdown";
import styles from "./index.module.css";

import type { FormEvent, InputHTMLAttributes } from "react";

type TagInputProps = {
  tags: string[];
  allTagOptions?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
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
      if (tags.includes(tag)) return;
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
        !tags.includes(option.toLowerCase()),
    );
  }, [inputValue, allTagOptions, tags]);

  return (
    <form className={styles["tag-input-wrapper"]} onSubmit={handleSubmit}>
      {heading && <h3>{heading}</h3>}
      <div ref={containerRef} className={styles["input-wrapper"]}>
        <div className={styles["tags-wrapper"]}>
          {tags.map((tag, id) => (
            <Batch
              key={`${tag}`}
              color="primary"
              onClick={() => {
                onRemoveTag(id);
              }}
            >
              {tag}
            </Batch>
          ))}
          <span className={styles["input-dropdown-container"]}>
            <Dropdown
              isOpen={options.length > 0 && isFocused}
              options={options}
              position="bottom"
              onSelect={(tag) => {
                if (tags.includes(tag.toLowerCase())) return;
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
