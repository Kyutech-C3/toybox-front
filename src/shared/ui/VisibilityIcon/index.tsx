import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import styles from "./index.module.css";

import type { WorkVisibility } from "@/shared/types/work";

type VisibilityIconProps = {
  visibility: WorkVisibility;
  className?: string;
  isLabelVisible?: boolean;
};

const VISIBILITY_LABELS: Record<WorkVisibility, string> = {
  public: "全体公開",
  private: "限定公開",
  draft: "下書き",
};

const VisibilityIcon = ({
  visibility,
  className,
  isLabelVisible = false,
}: VisibilityIconProps) => {
  const label = VISIBILITY_LABELS[visibility];
  const wrapperClassName = [styles["visibility-icon"], className]
    .filter(Boolean)
    .join(" ");
  const icon = (
    <>
      {visibility === "private" && <LockRoundedIcon fontSize="inherit" />}
      {visibility === "draft" && <EditNoteRoundedIcon fontSize="inherit" />}
      {visibility === "public" && <PublicRoundedIcon fontSize="inherit" />}
    </>
  );

  if (isLabelVisible) {
    return (
      <span className={wrapperClassName}>
        <span className={styles["visibility-glyph"]} aria-hidden="true">
          {icon}
        </span>
        <span className={styles["visibility-label"]}>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={wrapperClassName}
      role="img"
      aria-label={label}
      title={label}
    >
      {icon}
    </span>
  );
};

export default VisibilityIcon;
