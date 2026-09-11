import { useId } from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

import styles from "./index.module.css";

const HEART_PATH =
  "M13.35 20.13c-.76.69-1.93.69-2.69-.01l-.11-.1C5.3 15.27 1.87 12.16 2 8.28c.06-1.7.93-3.33 2.34-4.29 2.64-1.8 5.9-.96 7.66 1.1 1.76-2.06 5.02-2.91 7.66-1.1 1.41.96 2.28 2.59 2.34 4.29.14 3.88-3.3 6.99-8.55 11.76z";

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
  const outlineClipID = useId();

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
        <svg
          className={styles["like-icon-outline"]}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <clipPath id={outlineClipID}>
            <path d={HEART_PATH} />
          </clipPath>
          <path
            d={HEART_PATH}
            clipPath={`url(#${outlineClipID})`}
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {isCountVisible && <span className={styles["like-count"]}>{count}</span>}
    </button>
  );
};

export default LikeButton;
