import { useEffect, useMemo, useRef, useState } from "react";

import Batch from "../Batch";
import Dropdown from "../Dropdown";
import styles from "./index.module.css";

import type { ChangeEvent, FormEvent, InputHTMLAttributes } from "react";

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
  allTagOptions,
  addTag,
  removeTag,
  heading,
  ...props
}: TagInputProps) => {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tag = inputValue.trim();
    if (tag !== "") {
      if (tags.includes(tag)) return;
      addTag(tag);
      setInputValue("");
    }
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

  const options = useMemo(() => {
    if (!allTagOptions) return [];
    const lowerInput = inputValue.toLowerCase();
    return allTagOptions.filter(
      (option) =>
        option.toLowerCase().includes(lowerInput) &&
        !tags.includes(option.toUpperCase()),
    );
  }, [inputValue, allTagOptions, tags]);

  return (
    <form className={styles["tag-input-wrapper"]} onSubmit={onSubmit}>
      {heading && <h3>{heading}</h3>}
      <div ref={containerRef} className={styles["input-wrapper"]}>
        <div className={styles["tags-wrapper"]}>
          {tags.map((tag, id) => (
            <Batch key={`${tag}`} color="primary" onClick={() => removeTag(id)}>
              {tag}
            </Batch>
          ))}
          <span className={styles["input-dropdown-container"]}>
            <Dropdown
              isOpen={options.length > 0 && focused}
              options={options}
              position="bottom"
              onSelect={(tag) => {
                if (tags.includes(tag.toUpperCase())) return;
                addTag(tag);
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
