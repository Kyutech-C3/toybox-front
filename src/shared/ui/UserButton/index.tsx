import { Link } from "react-router-dom";

import Avatar from "../Avatar";
import styles from "./index.module.css";

type UserButtonProps = {
  userID: string;
  displayName: string;
  avatarURL?: string;
  size?: "compact" | "default";
};

const UserButton = ({
  userID,
  displayName,
  avatarURL,
  size = "default",
}: UserButtonProps) => {
  return (
    <Link
      to={`/users/${userID}`}
      className={styles["user-button"]}
      data-size={size}
      aria-label={`${displayName}のユーザーページを開く`}
    >
      <Avatar
        avatarURL={avatarURL}
        alt={`${displayName}のアバター`}
        size={size === "compact" ? "small" : "default"}
      />
      <span className={styles["display-name"]}>{displayName}</span>
    </Link>
  );
};

export default UserButton;
