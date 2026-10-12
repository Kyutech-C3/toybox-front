import styles from "./index.module.css";

import Copyright from "@/shared/ui/Copyright";
import { EXTERNAL_LINKS } from "@/shared/ui/ExternalLinks";

import type { ExternalLinkItem } from "@/shared/ui/ExternalLinks";

const FOOTER_EXTERNAL_LINKS = [
  EXTERNAL_LINKS.officialSite,
  EXTERNAL_LINKS.x,
  EXTERNAL_LINKS.youtube,
  EXTERNAL_LINKS.github,
] satisfies ExternalLinkItem[];

const Footer = () => (
  <footer className={styles["footer"]}>
    <nav className={styles["external-links"]} aria-label="C3 外部リンク">
      {FOOTER_EXTERNAL_LINKS.map(({ href, label, icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          className={styles["external-link"]}
        >
          <span className={styles["link-icon"]} aria-hidden="true">
            {icon}
          </span>
          <span className={styles["link-label"]}>{label}</span>
        </a>
      ))}
    </nav>
    <Copyright className={styles["copyright"]} />
  </footer>
);

export default Footer;
