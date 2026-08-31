import { useEffect, useRef, useState } from "react";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";

import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";

type ImgCardProps = {
  src: string;
  alt?: string;
  onLoadError?: () => void;
};

const ImgCard = ({ src, alt, onLoadError }: ImgCardProps) => {
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === imageWrapperRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await document.exitFullscreen();
        return;
      }

      await imageWrapperRef.current?.requestFullscreen();
    } catch {
      // Fullscreen APIが利用できない環境では表示を維持する
    }
  };

  const FullscreenIcon = isFullscreen
    ? FullscreenExitRoundedIcon
    : FullscreenRoundedIcon;

  return (
    <CardWrapper>
      <div className={styles["image-wrapper"]} ref={imageWrapperRef}>
        <img
          src={src}
          alt={alt}
          className={styles["card-img"]}
          onError={onLoadError}
        />
        <button
          className={styles["fullscreen-button"]}
          type="button"
          aria-label={isFullscreen ? "全画面表示を終了" : "画像を全画面表示"}
          onClick={handleFullscreen}
        >
          <FullscreenIcon aria-hidden="true" fontSize="large" />
        </button>
      </div>
    </CardWrapper>
  );
};

export default ImgCard;
