import { useState } from "react";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import styles from "./index.module.css";

type SiteFaviconProps = {
  url: string;
  size?: "small" | "default";
};

const GOOGLE_FAVICON_ENDPOINT = "https://t0.gstatic.com/faviconV2";

const getFaviconUrl = (url: string): string => {
  const params = new URLSearchParams({
    client: "SOCIAL",
    type: "FAVICON",
    fallback_opts: "TYPE,SIZE,URL",
    url: new URL(url).origin,
    size: "64",
  });
  return `${GOOGLE_FAVICON_ENDPOINT}?${params.toString()}`;
};

const SiteFavicon = ({ url, size = "default" }: SiteFaviconProps) => {
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const hasFallbackIcon = fallbackUrl === url;

  return (
    <span
      className={
        size === "small"
          ? `${styles["site-favicon"]} ${styles["small"]}`
          : styles["site-favicon"]
      }
      aria-hidden="true"
    >
      {hasFallbackIcon ? (
        <LanguageRoundedIcon />
      ) : (
        <img
          src={getFaviconUrl(url)}
          alt=""
          width="24"
          height="24"
          referrerPolicy="no-referrer"
          onLoad={(event) => {
            // Google's generic globe is returned as a 16px image even when 64px is requested.
            if (
              event.currentTarget.naturalWidth === 16 &&
              event.currentTarget.naturalHeight === 16
            ) {
              setFallbackUrl(url);
            }
          }}
          onError={() => setFallbackUrl(url)}
        />
      )}
    </span>
  );
};

export default SiteFavicon;
