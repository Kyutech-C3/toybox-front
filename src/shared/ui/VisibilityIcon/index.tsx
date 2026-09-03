import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import styles from "./index.module.css";

import type { WorkVisibility } from "@/shared/types/work";

type VisibilityIconProps = {
  visibility: WorkVisibility;
  className?: string;
};

/** 公開範囲は言語に依存しないよう icon で表し、名前は aria-label と title が持つ */
const VISIBILITY_LABELS: Record<WorkVisibility, string> = {
  public: "全体公開",
  private: "限定公開",
  draft: "下書き",
};

const VisibilityIcon = ({ visibility, className }: VisibilityIconProps) => {
  const label = VISIBILITY_LABELS[visibility];

  return (
    <span
      className={[styles["visibility-icon"], className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={label}
      title={label}
    >
      {visibility === "private" && <LockRoundedIcon fontSize="inherit" />}
      {visibility === "draft" && <EditNoteRoundedIcon fontSize="inherit" />}
      {visibility === "public" && <PublicRoundedIcon fontSize="inherit" />}
    </span>
  );
};

export default VisibilityIcon;
