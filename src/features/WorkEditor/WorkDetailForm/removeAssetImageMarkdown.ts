const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const removeAssetImageMarkdown = (description: string, url: string) => {
  const markdownURL = url.replaceAll("(", "%28").replaceAll(")", "%29");
  let nextDescription = description;
  for (const imageURL of new Set([url, markdownURL])) {
    const imagePattern = new RegExp(
      String.raw`!\[(?:\\.|[^\]\\])*\]\(${escapeRegExp(imageURL)}\)`,
      "g",
    );
    nextDescription = nextDescription.replace(imagePattern, "");
  }
  return nextDescription;
};
