const normalizeTagNameInput = (name: string): string =>
  name
    .trim()
    .replace(/^(?:[#＃]\s*)+/, "")
    .trim();

const formatTagLabel = (name: string): string =>
  `#${normalizeTagNameInput(name)}`;

export { formatTagLabel, normalizeTagNameInput };
