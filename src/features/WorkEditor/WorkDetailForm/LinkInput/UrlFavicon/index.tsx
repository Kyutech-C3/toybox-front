import styles from "./index.module.css";

import SiteFavicon from "@/shared/ui/SiteFavicon";

type UrlFaviconProps = {
  url: string;
};

const UrlFavicon = ({ url }: UrlFaviconProps) => (
  <a
    className={styles["favicon"]}
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${url}を開く`}
  >
    <SiteFavicon url={url} />
  </a>
);

export default UrlFavicon;
