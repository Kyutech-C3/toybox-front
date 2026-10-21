import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import c3Logo from "@/assets/C3Logo.svg";

import type { ReactNode } from "react";

export type ExternalLinkItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const EXTERNAL_LINKS = {
  officialSite: {
    href: "https://compositecomputer.club/",
    label: "C3 公式サイト",
    icon: <img src={c3Logo} alt="" width={24} height={24} />,
  },
  x: {
    href: "https://x.com/c3_kyutech",
    label: "C3 X",
    icon: <XIcon />,
  },
  youtube: {
    href: "https://www.youtube.com/@compositecomputerclub2597",
    label: "C3 Youtubeチャンネル",
    icon: <YouTubeIcon />,
  },
  github: {
    href: "https://github.com/Kyutech-C3",
    label: "C3 GitHub",
    icon: <GitHubIcon />,
  },
} satisfies Record<string, ExternalLinkItem>;
