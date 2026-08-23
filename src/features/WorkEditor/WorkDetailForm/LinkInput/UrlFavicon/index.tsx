import { useState } from "react";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import styles from "./index.module.css";

type UrlFaviconProps = {
  url: string;
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

const UrlFavicon = ({ url }: UrlFaviconProps) => {
  const [hasLoadError, setHasLoadError] = useState(false);

  return (
    <a
      className={styles["favicon"]}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${url}を開く`}
    >
      {hasLoadError ? (
        <LanguageRoundedIcon />
      ) : (
        <img
          src={getFaviconUrl(url)}
          alt=""
          width="24"
          height="24"
          referrerPolicy="no-referrer"
          onError={() => setHasLoadError(true)}
        />
      )}
    </a>
  );
};

export default UrlFavicon;
