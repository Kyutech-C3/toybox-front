const getSafeAssetURL = (url: string): string | undefined => {
  try {
    const parsedURL = new URL(url);

    if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
      return undefined;
    }

    return parsedURL.href;
  } catch {
    return undefined;
  }
};

export { getSafeAssetURL };
