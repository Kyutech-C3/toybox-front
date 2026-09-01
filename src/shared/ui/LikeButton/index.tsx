import { useState } from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

import styles from "./index.module.css";

type LikeButtonProps = {
  count?: number;
  isLiked?: boolean;
  onToggle?: (isLiked: boolean) => void;
  isCountVisible?: boolean;
  className?: string;
};

const LikeButton = ({
  count = 0,
  isLiked,
  onToggle,
  isCountVisible = false,
  className,
}: LikeButtonProps) => {
  const [isLikedLocally, setIsLikedLocally] = useState(false);
  const isControlled = isLiked !== undefined;
  const currentIsLiked = isControlled ? isLiked : isLikedLocally;
  const displayCount = isControlled ? count : count + (isLikedLocally ? 1 : 0);

  const handleClick = () => {
    const nextIsLiked = !currentIsLiked;
    if (!isControlled) setIsLikedLocally(nextIsLiked);
    onToggle?.(nextIsLiked);
  };

  return (
    <button
      type="button"
      className={[styles["like-button"], className].filter(Boolean).join(" ")}
      data-liked={currentIsLiked ? "true" : "false"}
      aria-pressed={currentIsLiked}
      aria-label={currentIsLiked ? "いいねを取り消す" : "いいねする"}
      title={currentIsLiked ? "いいねを取り消す" : "いいねする"}
      onClick={handleClick}
    >
      {currentIsLiked ? (
        <FavoriteRoundedIcon fontSize="inherit" />
      ) : (
        <FavoriteBorderRoundedIcon fontSize="inherit" />
      )}
      {isCountVisible && (
        <span className={styles["like-count"]}>{displayCount}</span>
      )}
    </button>
  );
};

export default LikeButton;
