import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import styles from "./index.module.css";

import SiteFavicon from "@/shared/ui/SiteFavicon";

type LinkListProps = {
  urls: string[];
  ariaLabel?: string;
};

const LinkList = ({ urls, ariaLabel = "リンク" }: LinkListProps) => {
  const links = [...new Set(urls)].flatMap((url) => {
    try {
      const parsedURL = new URL(url);
      return parsedURL.protocol === "http:" || parsedURL.protocol === "https:"
        ? [{ url, href: parsedURL.href }]
        : [];
    } catch {
      return [];
    }
  });

  if (links.length === 0) return null;

  return (
    <section className={styles["link-list"]} aria-label={ariaLabel}>
      <ul className={styles["link-items"]}>
        {links.map(({ url, href }) => (
          <li key={url} className={styles["link-item"]}>
            <a
              className={styles["link"]}
              href={href}
              title={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiteFavicon url={url} size="small" />
              <span className={styles["link-url"]}>{url}</span>
              <OpenInNewRoundedIcon
                className={styles["external-icon"]}
                aria-hidden="true"
                fontSize="inherit"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default LinkList;
