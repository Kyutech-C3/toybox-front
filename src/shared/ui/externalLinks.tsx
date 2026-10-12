import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import c3Logo from "@/assets/C3Logo.svg";

export const EXTERNAL_LINKS = [
  {
    href: "https://compositecomputer.club/",
    label: "C3 公式サイト",
    icon: <img src={c3Logo} alt="" width={24} height={24} />,
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
