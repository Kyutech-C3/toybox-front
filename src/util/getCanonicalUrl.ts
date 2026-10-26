const SITE_ORIGIN = "https://toybox.compositecomputer.club";

export const getCanonicalUrl = (pathname: string): string => {
  const url = new URL(pathname, SITE_ORIGIN);
  url.search = "";
  url.hash = "";

  return url.href;
};
