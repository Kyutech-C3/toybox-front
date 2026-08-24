import { useId } from "react";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import Batch from "../Batch";
import styles from "./index.module.css";

import type { FormEvent, InputHTMLAttributes } from "react";

type UrlInputProps = {
  urls: string[];
  maxUrlCount: number;
  value: string;
  onChange: (value: string) => void;
  onAddUrl: () => void;
  onRemoveUrl: (index: number) => void;
  heading?: string;
  errorMessage?: string;
  isOptional?: boolean;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>;

const UrlInput = ({
  urls,
  maxUrlCount,
  value,
  onChange,
  onAddUrl,
  onRemoveUrl,
  heading,
  errorMessage = "",
  isOptional = false,
  ...props
}: UrlInputProps) => {
  const errorMessageID = useId();
  const hasError = errorMessage !== "";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddUrl();
  };

  return (
    <form className={styles["url-input-wrapper"]} onSubmit={handleSubmit}>
      <div className={styles["heading-wrapper"]}>
        {heading && <h3>{heading}</h3>}
        {isOptional && <Batch color="secondary">オプション</Batch>}
        <span className={styles["url-count"]}>
          {urls.length}/{maxUrlCount}
        </span>
      </div>
      <div
        className={styles["input-wrapper"]}
        data-error={hasError ? "true" : "false"}
      >
        <div className={styles["input-row"]}>
          <input
            type="text"
            name="url"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            className={styles["input-field"]}
            aria-label={heading}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorMessageID : undefined}
            {...props}
          />
          <button
            type="submit"
            className={styles["add-button"]}
            aria-label="URLを追加"
          >
            <AddIcon fontSize="inherit" />
          </button>
        </div>
        {hasError && (
          <p
            id={errorMessageID}
            className={styles["error-message"]}
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
      {urls.length > 0 && (
        <ul className={styles["urls-wrapper"]}>
          {urls.map((url, index) => (
            <li key={url} className={styles["url-row"]}>
              <span className={styles["url-text"]}>{url}</span>
              <button
                type="button"
                className={styles["remove-button"]}
                onClick={() => {
                  onRemoveUrl(index);
                }}
                aria-label={`${url} を削除`}
              >
                <CloseIcon fontSize="inherit" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default UrlInput;
