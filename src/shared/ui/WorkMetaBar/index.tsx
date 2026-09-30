import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";

import styles from "./index.module.css";

import VisibilityIcon from "@/shared/ui/VisibilityIcon";
import { formatDateTime } from "@/util/formatDateTime";

import type { WorkVisibility } from "@/shared/types/work";

type WorkMetaBarProps = {
  visibility: WorkVisibility;
  createdAt: string;
  updatedAt: string;
};

const WorkMetaBar = ({
  visibility,
  createdAt,
  updatedAt,
}: WorkMetaBarProps) => (
  <div className={styles["work-meta-bar"]}>
    <VisibilityIcon
      visibility={visibility}
      className={styles["visibility"]}
      isLabelVisible
    />
    <dl className={styles["dates"]}>
      <div className={styles["date"]}>
        <dt>
          <span
            className={styles["date-icon"]}
            role="img"
            aria-label="投稿日"
            title="投稿日"
          >
            <AccessTimeRoundedIcon fontSize="inherit" />
          </span>
        </dt>
        <dd>
          <time dateTime={createdAt}>{formatDateTime(createdAt)}</time>
        </dd>
      </div>
      <div className={styles["date"]}>
        <dt>
          <span
            className={styles["date-icon"]}
            role="img"
            aria-label="更新日"
            title="更新日"
          >
            <AutorenewRoundedIcon fontSize="inherit" />
          </span>
        </dt>
        <dd>
          <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>
        </dd>
      </div>
    </dl>
  </div>
);

export default WorkMetaBar;
