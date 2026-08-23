import { useEffect, useId, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import styles from "./index.module.css";

import { MAX_WORK_URL_COUNT } from "@/features/WorkEditor/constants";

import type { FocusEvent, KeyboardEvent } from "react";

type LinkInputProps = {
  urls: string[];
  onChangeUrls: (urls: string[]) => void;
};

type UrlField = {
  id: string;
  value: string;
  committedUrl: string | null;
  error: string;
};

const GOOGLE_FAVICON_ENDPOINT = "https://t0.gstatic.com/faviconV2";

const createUrlField = (value = ""): UrlField => ({
  id: crypto.randomUUID(),
  value,
  committedUrl: value === "" ? null : value,
  error: "",
});

const getUrlError = (
  value: string,
  fields: UrlField[],
  fieldID: string,
): string => {
  if (value === "") return "URLを入力してください";
  if (
    fields.some((field) => field.id !== fieldID && field.value.trim() === value)
  ) {
    return "このURLは追加済みです";
  }

  try {
    const url = new URL(value);
    if (
      !/^https?:\/\//i.test(value) ||
      !["http:", "https:"].includes(url.protocol) ||
      url.hostname === ""
    ) {
      return "http または https の絶対URLを入力してください";
    }
  } catch {
    return "http または https の絶対URLを入力してください";
  }

  return "";
};

const getCommittedUrls = (fields: UrlField[]): string[] =>
  fields.flatMap((field) =>
    field.committedUrl === null ? [] : [field.committedUrl],
  );

const areUrlsEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  left.every((url, index) => url === right[index]);

const getFaviconUrl = (url: string): string => {
  const params = new URLSearchParams({
    client: "SOCIAL",
    type: "FAVICON",
    fallback_opts: "TYPE,SIZE,URL",
    url: new URL(url).origin,
    size: "64",
  });
  return `${GOOGLE_FAVICON_ENDPOINT}?${params.toString()}`;
};

const LinkInput = ({ urls, onChangeUrls }: LinkInputProps) => {
  const errorID = useId();
  const [fields, setFields] = useState<UrlField[]>(() => {
    const initialFields = urls
      .slice(0, MAX_WORK_URL_COUNT)
      .map((url) => createUrlField(url));
    return initialFields.length === 0 ? [createUrlField()] : initialFields;
  });
  const emittedUrlsRef = useRef<string[] | null>(null);
  const hasReachedUrlLimit = fields.length >= MAX_WORK_URL_COUNT;

  useEffect(() => {
    if (
      emittedUrlsRef.current !== null &&
      areUrlsEqual(emittedUrlsRef.current, urls)
    ) {
      emittedUrlsRef.current = null;
      return;
    }

    const nextFields = urls
      .slice(0, MAX_WORK_URL_COUNT)
      .map((url) => createUrlField(url));
    setFields(nextFields.length === 0 ? [createUrlField()] : nextFields);
  }, [urls]);

  const commitUrls = (nextFields: UrlField[]) => {
    const nextUrls = getCommittedUrls(nextFields);
    emittedUrlsRef.current = nextUrls;
    onChangeUrls(nextUrls);
  };

  const handleAddField = () => {
    if (hasReachedUrlLimit) return;
    setFields((current) => [...current, createUrlField()]);
  };

  const handleChange = (fieldID: string, value: string) => {
    const nextFields = fields.map((field) =>
      field.id === fieldID
        ? { ...field, value, committedUrl: null, error: "" }
        : field,
    );
    setFields(nextFields);
    commitUrls(nextFields);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>, fieldID: string) => {
    const value = event.currentTarget.value.trim();
    const error = getUrlError(value, fields, fieldID);
    const nextFields = fields.map((field) =>
      field.id === fieldID
        ? {
            ...field,
            value,
            committedUrl: error === "" ? value : null,
            error,
          }
        : field,
    );
    setFields(nextFields);
    commitUrls(nextFields);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const handleRemoveField = (fieldID: string) => {
    const remainingFields = fields.filter((field) => field.id !== fieldID);
    const nextFields =
      remainingFields.length === 0 ? [createUrlField()] : remainingFields;
    setFields(nextFields);
    commitUrls(nextFields);
  };

  return (
    <div className={styles["link-input"]}>
      <div className={styles["heading-row"]}>
        <h3>リンク</h3>
        <span className={styles["optional-label"]}>オプション</span>
        <button
          type="button"
          className={styles["add-button"]}
          onClick={handleAddField}
          disabled={hasReachedUrlLimit}
          aria-label="リンク入力欄を追加"
        >
          <AddRoundedIcon />
        </button>
        <span className={styles["url-count"]}>
          {fields.length}/{MAX_WORK_URL_COUNT}
        </span>
      </div>
      <div className={styles["url-fields"]}>
        {fields.map((field, index) => {
          const fieldErrorID = `${errorID}-${field.id}`;
          return (
            <div key={field.id} className={styles["url-field"]}>
              <div
                className={styles["input-row"]}
                data-invalid={field.error !== "" ? "true" : "false"}
              >
                <span className={styles["favicon-slot"]}>
                  {field.committedUrl !== null && (
                    <a
                      className={styles["favicon"]}
                      href={field.committedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${field.committedUrl}を開く`}
                    >
                      <LanguageRoundedIcon />
                      <img
                        key={field.committedUrl}
                        src={getFaviconUrl(field.committedUrl)}
                        alt=""
                        width="24"
                        height="24"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    </a>
                  )}
                </span>
                <div className={styles["input-control"]}>
                  <input
                    type="url"
                    inputMode="url"
                    name="url"
                    value={field.value}
                    placeholder="https://example.com/"
                    aria-label={`リンク ${index + 1}`}
                    aria-invalid={field.error !== ""}
                    aria-describedby={
                      field.error !== "" ? fieldErrorID : undefined
                    }
                    onChange={(event) =>
                      handleChange(field.id, event.target.value)
                    }
                    onBlur={(event) => handleBlur(event, field.id)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    aria-label={`リンク ${index + 1}を削除`}
                  >
                    <CloseRoundedIcon />
                  </button>
                </div>
              </div>
              {field.error !== "" && (
                <span
                  id={fieldErrorID}
                  className={styles["input-error"]}
                  role="alert"
                >
                  {field.error}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinkInput;
