export const getVisiblePopularTagCount = (
  tagWidths: number[],
  expandWidth: number,
  availableWidth: number,
  gap: number,
) => {
  const fitsInTwoRows = (count: number, includeExpand: boolean) => {
    let rows = 1;
    let rowWidth = 0;
    const itemCount = count + Number(includeExpand);

    for (let index = 0; index < itemCount; index += 1) {
      const width = index === count ? expandWidth : (tagWidths[index] ?? 0);
      if (rowWidth > 0 && rowWidth + gap + width > availableWidth) {
        rows += 1;
        rowWidth = width;
      } else {
        rowWidth += (rowWidth > 0 ? gap : 0) + width;
      }
      if (rows > 2) return false;
    }
    return true;
  };

  if (fitsInTwoRows(tagWidths.length, false)) return tagWidths.length;

  let count = 0;
  while (count < tagWidths.length && fitsInTwoRows(count + 1, true)) {
    count += 1;
  }
  return count;
};
