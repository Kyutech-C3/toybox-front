import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

import Button from "@/shared/ui/Button";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";

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
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }

    if (await copyTextToClipboard(url)) {
      showToast({ message: "リンクをコピーしました", severity: "success" });
      return;
    }

    showToast({
      message: "リンクをコピーできませんでした",
      severity: "error",
    });
  };

  return (
    <Button
      variant="ghost"
      size="small"
      isIconOnly
      icon={<IosShareRoundedIcon />}
      onClick={() => void handleShare()}
      aria-label="この作品を共有する"
      title="共有する"
    />
  );
};

export default ShareButton;
