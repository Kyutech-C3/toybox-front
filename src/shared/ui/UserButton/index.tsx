import { Link } from "react-router-dom";

import Avatar from "../Avatar";
import styles from "./index.module.css";

type UserButtonProps = {
  userID: string;
  displayName: string;
  avatarURL?: string;
};

const UserButton = ({ userID, displayName, avatarURL }: UserButtonProps) => {
  return (
    <Link
      to={`/user/${userID}`}
      className={styles["user-button"]}
      aria-label={`${displayName}のユーザーページを開く`}
    >
      <Avatar avatarURL={avatarURL} alt={`${displayName}のアバター`} />
      <span className={styles["display-name"]}>{displayName}</span>
    </Link>
  );
};

export default UserButton;
