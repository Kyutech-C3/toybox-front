import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

import styles from "./index.module.css";

type LikeButtonProps = {
  count?: number;
  isLiked: boolean;
  onToggle: () => void;
  isCountVisible?: boolean;
  isDisabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

const LikeButton = ({
  count = 0,
  isLiked,
  onToggle,
  isCountVisible = false,
  isDisabled = false,
  ariaLabel,
  className,
}: LikeButtonProps) => {
  const label = ariaLabel ?? (isLiked ? "いいねを取り消す" : "いいねする");

  return (
    <button
      type="button"
      className={[styles["like-button"], className].filter(Boolean).join(" ")}
      data-liked={isLiked ? "true" : "false"}
      aria-pressed={isLiked}
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onToggle}
    >
      <span className={styles["like-icon"]}>
        <FavoriteRoundedIcon
          className={styles["like-icon-fill"]}
          fontSize="inherit"
        />
        <FavoriteBorderRoundedIcon
          className={styles["like-icon-outline"]}
          fontSize="inherit"
        />
      </span>
      {isCountVisible && <span className={styles["like-count"]}>{count}</span>}
    </button>
  );
};

export default LikeButton;
