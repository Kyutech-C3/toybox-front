import { useState } from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import styles from "./index.module.css";

import LoadingImage from "@/shared/ui/LoadingImage";

type AvatarProps = {
  avatarURL?: string;
  alt?: string;
  size?: "small" | "default" | "profile";
};

const Avatar = ({
  avatarURL,
  alt = "ユーザーのアバター",
  size = "default",
}: AvatarProps) => {
  const [failedURL, setFailedURL] = useState<string>();
  const hasImage = !!avatarURL && failedURL !== avatarURL;

  return (
    <div className={styles["avatar-wrapper"]} data-size={size}>
      {hasImage ? (
        <LoadingImage
          alt={alt}
          src={avatarURL}
          loading="lazy"
          className={styles["avatar-image"]}
          onError={() => setFailedURL(avatarURL)}
        />
      ) : (
        <span
          className={styles["avatar-placeholder"]}
          role="img"
          aria-label={alt}
        >
          <PersonRoundedIcon fontSize="inherit" aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

export default Avatar;
