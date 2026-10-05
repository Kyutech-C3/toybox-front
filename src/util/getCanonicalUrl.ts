const SITE_ORIGIN = "https://toybox.compositecomputer.club";

export const getCanonicalUrl = (
  pathname: string,
  searchParams = new URLSearchParams(),
): string => {
  const url = new URL(pathname, SITE_ORIGIN);
  url.search = "";
  url.hash = "";

  if (url.pathname === "/") {
    const tagIDs = [...new Set(searchParams.get("tags")?.split(",") ?? [])]
      .filter(Boolean)
      .sort();
    if (tagIDs.length > 0) url.searchParams.set("tags", tagIDs.join(","));
    if (searchParams.get("sort") === "oldest") {
      url.searchParams.set("sort", "oldest");
    }
    const visibility = searchParams.get("visibility");
    if (visibility === "public" || visibility === "private") {
      url.searchParams.set("visibility", visibility);
    }
  }

  return url.href;
};
