import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import styles from "./index.module.css";

import SiteFavicon from "@/shared/ui/SiteFavicon";

type WorkLinksProps = {
  urls: string[];
};

const WorkLinks = ({ urls }: WorkLinksProps) => {
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
    <section className={styles["work-links"]} aria-label="リンク">
      <ul className={styles["work-link-list"]}>
        {links.map(({ url, href }) => (
          <li key={url}>
            <a
              className={styles["work-link"]}
              href={href}
              title={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiteFavicon url={url} size="small" />
              <span className={styles["work-link-url"]}>{url}</span>
              <OpenInNewRoundedIcon
                className={styles["work-link-external-icon"]}
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

export default WorkLinks;
