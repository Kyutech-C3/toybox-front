import { useId } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import UrlFavicon from "../UrlFavicon";
import styles from "./index.module.css";

import type { KeyboardEvent } from "react";

type UrlInputFieldProps = {
  index: number;
  value: string;
  committedUrl: string | null;
  error: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  onRemove: () => void;
};

const UrlInputField = ({
  index,
  value,
  committedUrl,
  error,
  onChange,
  onCommit,
  onRemove,
}: UrlInputFieldProps) => {
  const errorID = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles["url-field"]}>
      <div
        className={styles["input-row"]}
        data-invalid={error !== "" ? "true" : "false"}
      >
        <span className={styles["favicon-slot"]}>
          {committedUrl !== null && (
            <UrlFavicon key={committedUrl} url={committedUrl} />
          )}
        </span>
        <div className={styles["input-control"]}>
          <input
            type="url"
            inputMode="url"
            name="url"
            value={value}
            placeholder="https://example.com/"
            aria-label={`リンク ${index + 1}`}
            aria-invalid={error !== ""}
            aria-describedby={error !== "" ? errorID : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={(event) => onCommit(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`リンク ${index + 1}を削除`}
          >
            <CloseRoundedIcon />
          </button>
        </div>
      </div>
      {error !== "" && (
        <span id={errorID} className={styles["input-error"]} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default UrlInputField;
