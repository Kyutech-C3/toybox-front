import styles from "./index.module.css";

type AvatarProps = {
  avatarURL?: string;
};

const Avatar = ({ avatarURL = "./comingSoonLugia.webp" }: AvatarProps) => {
  return (
    <div className={styles["avatar-wrapper"]}>
      <img
        alt="avatar-image"
        src={avatarURL}
        className={styles["avatar-image"]}
      />
    </div>
  );
};

export default Avatar;
