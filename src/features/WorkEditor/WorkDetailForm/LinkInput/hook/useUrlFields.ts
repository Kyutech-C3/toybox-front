import { useEffect, useRef, useState } from "react";

import { MAX_WORK_URL_COUNT } from "@/features/WorkEditor/constants";

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

type UseUrlFieldsReturn = {
  fields: UrlField[];
  hasReachedUrlLimit: boolean;
  handleAddField: () => void;
  handleChangeField: (fieldID: string, value: string) => void;
  handleCommitField: (fieldID: string, value: string) => void;
  handleRemoveField: (fieldID: string) => void;
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

    setFields(createInitialFields(urls));
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
    const value = inputValue.trim();
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

  const handleRemoveField = (fieldID: string) => {
    const remainingFields = fields.filter((field) => field.id !== fieldID);
    const nextFields =
      remainingFields.length === 0 ? [createUrlField()] : remainingFields;
    setFields(nextFields);
    commitUrls(nextFields);
  };

  return {
    fields,
    hasReachedUrlLimit,
    handleAddField,
    handleChangeField,
    handleCommitField,
    handleRemoveField,
  };
};

export default useUrlFields;
