import { useLayoutEffect, useRef, useState } from "react";

import { MAX_WORK_URL_COUNT } from "@/features/WorkEditor/constants";
import { normalizeInputText } from "@/util/normalizeInputText";

type UrlField = {
  id: string;
  value: string;
  committedUrl: string | null;
  error: string;
};

type UseUrlFieldsParams = {
  urls: string[];
  onChangeUrls: (urls: string[]) => void;
};

type UrlFieldFocusDirection = "backward" | "forward";

type UseUrlFieldsReturn = {
  fields: UrlField[];
  focusFieldID: string | null;
  hasReachedUrlLimit: boolean;
  handleAddField: () => void;
  handleAddFieldAfter: (fieldID: string, value: string) => void;
  handleChangeField: (fieldID: string, value: string) => void;
  handleCommitField: (fieldID: string, value: string) => void;
  handleRemoveField: (fieldID: string) => void;
  handleRemoveEmptyField: (
    fieldID: string,
    direction: UrlFieldFocusDirection,
  ) => void;
  handleFocusApplied: () => void;
};

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

const createInitialFields = (urls: string[]): UrlField[] => {
  const fields = urls
    .slice(0, MAX_WORK_URL_COUNT)
    .map((url) => createUrlField(url));
  return fields.length === 0 ? [createUrlField()] : fields;
};

const useUrlFields = ({
  urls,
  onChangeUrls,
}: UseUrlFieldsParams): UseUrlFieldsReturn => {
  const [fields, setFields] = useState<UrlField[]>(() =>
    createInitialFields(urls),
  );
  const [focusFieldID, setFocusFieldID] = useState<string | null>(null);
  const emittedUrlsRef = useRef<string[] | null>(null);
  const hasReachedUrlLimit = fields.length >= MAX_WORK_URL_COUNT;

  useLayoutEffect(() => {
    if (
      emittedUrlsRef.current !== null &&
      areUrlsEqual(emittedUrlsRef.current, urls)
    ) {
      emittedUrlsRef.current = null;
      return;
    }

    setFields(createInitialFields(urls));
  }, [urls]);

  const commitUrls = (nextFields: UrlField[]) => {
    const nextUrls = getCommittedUrls(nextFields);
    emittedUrlsRef.current = nextUrls;
    onChangeUrls(nextUrls);
  };

  const handleAddField = () => {
    if (hasReachedUrlLimit) return;

    const newField = createUrlField();
    setFields((current) => [...current, newField]);
    setFocusFieldID(newField.id);
  };

  const handleChangeField = (fieldID: string, value: string) => {
    const nextFields = fields.map((field) =>
      field.id === fieldID
        ? { ...field, value, committedUrl: null, error: "" }
        : field,
    );
    setFields(nextFields);
    commitUrls(nextFields);
  };

  const handleCommitField = (fieldID: string, inputValue: string) => {
    const value = normalizeInputText(inputValue);
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

  const handleAddFieldAfter = (fieldID: string, inputValue: string) => {
    const targetField = fields.find((field) => field.id === fieldID);
    if (!targetField) return;

    const value = normalizeInputText(inputValue);
    const error = getUrlError(value, fields, fieldID);
    const committedField = {
      ...targetField,
      value,
      committedUrl: error === "" ? value : null,
      error,
    };
    const canAddField = error === "" && !hasReachedUrlLimit;
    const newField = createUrlField();
    const nextFields = fields.flatMap((field) => {
      if (field.id !== fieldID) return [field];
      return canAddField ? [committedField, newField] : [committedField];
    });

    setFields(nextFields);
    commitUrls(nextFields);
    if (canAddField) setFocusFieldID(newField.id);
  };

  const handleRemoveEmptyField = (
    fieldID: string,
    direction: UrlFieldFocusDirection,
  ) => {
    const index = fields.findIndex((field) => field.id === fieldID);
    if (index === -1 || fields.length <= 1) return;

    const nextFields = fields.filter((field) => field.id !== fieldID);
    const focusIndex =
      direction === "backward"
        ? Math.max(index - 1, 0)
        : Math.min(index, nextFields.length - 1);

    setFields(nextFields);
    commitUrls(nextFields);
    setFocusFieldID(nextFields[focusIndex].id);
  };

  const handleFocusApplied = () => setFocusFieldID(null);

  const handleRemoveField = (fieldID: string) => {
    const remainingFields = fields.filter((field) => field.id !== fieldID);
    const nextFields =
      remainingFields.length === 0 ? [createUrlField()] : remainingFields;
    setFields(nextFields);
    commitUrls(nextFields);
  };

  return {
    fields,
    focusFieldID,
    hasReachedUrlLimit,
    handleAddField,
    handleAddFieldAfter,
    handleChangeField,
    handleCommitField,
    handleRemoveField,
    handleRemoveEmptyField,
    handleFocusApplied,
  };
};

export default useUrlFields;
