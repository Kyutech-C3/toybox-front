import { Link } from "react-router-dom";

import styles from "./index.module.css";

import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import UserButton from "@/shared/ui/UserButton";

import type { ReactNode } from "react";

type WorkAuthorBarProps = {
  userID: string;
  displayName: string;
  avatarURL?: string;
  editPath?: string;
  actions?: ReactNode;
};

const WorkAuthorBar = ({
  userID,
  displayName,
  avatarURL,
  editPath,
  actions,
}: WorkAuthorBarProps) => (
  <div className={styles["work-author-bar"]}>
    <div className={styles["author"]}>
      <UserButton
        userID={userID}
        displayName={displayName}
        avatarURL={avatarURL}
      />
    </div>
    {(editPath || actions) && (
      <div className={styles["actions"]}>
        {editPath && (
          <Link
            to={editPath}
            className={styles["edit-link"]}
            aria-label="この作品を編集する"
          >
            <span className={styles["edit-icon"]} aria-hidden="true">
              <EditSquareIcon />
            </span>
            <span className={styles["edit-label"]}>編集</span>
          </Link>
        )}
        {actions}
      </div>
    )}
  </div>
);

export default WorkAuthorBar;
