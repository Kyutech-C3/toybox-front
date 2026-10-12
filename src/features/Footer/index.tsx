import styles from "./index.module.css";

import Copyright from "@/shared/ui/Copyright";
import { EXTERNAL_LINKS } from "@/shared/ui/externalLinks";

const Footer = () => (
  <footer className={styles["footer"]}>
    <nav className={styles["external-links"]} aria-label="C3 外部リンク">
      {EXTERNAL_LINKS.map(({ href, label, icon }) => (
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
