export const normalizeInputText = (value: string): string =>
  value.normalize("NFKC").trim();
