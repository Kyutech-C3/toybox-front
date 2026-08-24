import styles from "./index.module.css";

type AvatarProps = {
  avatarURL?: string;
  alt?: string;
  size?: "default" | "profile";
};

const Avatar = ({
  avatarURL = "./comingSoonLugia.webp",
  alt = "ユーザーのアバター",
  size = "default",
}: AvatarProps) => {
  return (
    <div className={styles["avatar-wrapper"]} data-size={size}>
      <img alt={alt} src={avatarURL} className={styles["avatar-image"]} />
    </div>
  );
};

export default Avatar;
