const normalizeTagNameInput = (name: string): string =>
  name
    .trim()
    .replace(/^(?:[#＃]\s*)+/, "")
    .trim();

export { normalizeTagNameInput };
