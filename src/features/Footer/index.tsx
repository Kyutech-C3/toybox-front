import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import styles from "./index.module.css";

import c3Logo from "@/assets/C3Logo.svg";

const LINKS = [
  {
    href: "https://compositecomputer.club/",
    label: "C3 公式サイト",
    icon: <img className={styles["logo"]} src={c3Logo} alt="" />,
  },
  {
    href: "https://x.com/c3_kyutech",
    label: "C3 X",
    icon: <XIcon />,
  },
  {
    href: "https://www.youtube.com/@compositecomputerclub2597",
    label: "C3 Youtubeチャンネル",
    icon: <YouTubeIcon />,
  },
  {
    href: "https://github.com/Kyutech-C3",
    label: "C3 GitHub",
    icon: <GitHubIcon />,
  },
];

const Footer = () => (
  <footer className={styles["footer"]}>
    <nav className={styles["links"]} aria-label="C3 関連リンク">
      {LINKS.map(({ href, label, icon }) => (
        <a
          key={href}
          className={styles["link"]}
          href={href}
          aria-label={label}
          title={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          {icon}
        </a>
      ))}
    </nav>
    <small className={styles["copyright"]}>
      © 2022 - {new Date().getFullYear()} Composite Computer Club
    </small>
  </footer>
);

export default Footer;
