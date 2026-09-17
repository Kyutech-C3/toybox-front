import useFavorite from "./hook/useFavorite";

import LikeButton from "@/shared/ui/LikeButton";
import useToast from "@/shared/ui/Toast/hook/useToast";

type FavoriteButtonProps = {
  workID: string;
  isInitiallyLiked?: boolean;
  isCountVisible?: boolean;
  className?: string;
};

const FavoriteButton = ({
  workID,
  isInitiallyLiked,
  isCountVisible = false,
  className,
}: FavoriteButtonProps) => {
  const { showToast } = useToast();
  const { count, isLiked, isLoading, isSubmitting, canToggle, toggleFavorite } =
    useFavorite({ workID, isInitiallyLiked, isCountVisible });
  const isDisabled = !canToggle || isLoading || isSubmitting;
  const ariaLabel = !canToggle
    ? "いいねするにはログインが必要です"
    : isLoading
      ? "いいねを読み込み中"
      : undefined;

  const handleToggle = async () => {
    try {
      await toggleFavorite();
    } catch {
      showToast({
        message: "いいねを更新できませんでした",
        severity: "error",
      });
    }
  };

  return (
    <LikeButton
      count={count}
      isLiked={isLiked}
      isCountVisible={isCountVisible}
      isDisabled={isDisabled}
      ariaLabel={ariaLabel}
      className={className}
      onToggle={() => void handleToggle()}
    />
  );
};

export default FavoriteButton;
