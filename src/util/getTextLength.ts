export const getTextLength = (
  value: string,
  newlineLength: 1 | 2 = 1,
): number =>
  Array.from(newlineLength === 2 ? value.replace(/\r\n?|\n/g, "\r\n") : value)
    .length;
