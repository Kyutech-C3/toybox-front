import styles from "./index.module.css";

import type { SyntheticEvent } from "react";

type AvatarProps = {
  avatarURL?: string;
  alt?: string;
  size?: "default" | "profile";
};

const DEFAULT_AVATAR_URL = "/comingSoonLugia.webp";

const Avatar = ({
  avatarURL,
  alt = "ユーザーのアバター",
  size = "default",
}: AvatarProps) => {
  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith(DEFAULT_AVATAR_URL)) {
      image.src = DEFAULT_AVATAR_URL;
    }
  };

  return (
    <div className={styles["avatar-wrapper"]} data-size={size}>
      <img
        alt={alt}
        src={avatarURL || DEFAULT_AVATAR_URL}
        className={styles["avatar-image"]}
        onError={handleImageError}
      />
    </div>
  );
};

export default Avatar;
