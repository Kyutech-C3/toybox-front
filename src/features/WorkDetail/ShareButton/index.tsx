import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

import styles from "./index.module.css";

import useToast from "@/shared/ui/Toast/hook/useToast";

type ShareButtonProps = {
  title: string;
};

const ShareButton = ({ title }: ShareButtonProps) => {
  const { showToast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (navigator.share && isCoarsePointer) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: "リンクをコピーしました", severity: "success" });
    } catch {
      showToast({
        message: "リンクをコピーできませんでした",
        severity: "error",
      });
    }
  };

  return (
    <button
      type="button"
      className={styles["share-button"]}
      onClick={() => void handleShare()}
      aria-label="この作品を共有する"
      title="共有する"
    >
      <IosShareRoundedIcon fontSize="inherit" />
    </button>
  );
};

export default ShareButton;
