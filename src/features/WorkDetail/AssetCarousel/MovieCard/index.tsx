import { useRef } from "react";

import MediaPlayer from "../MediaPlayer";
import useAutoHideControls from "../MediaPlayer/hook/useAutoHideControls";
import useMediaPlayer from "../MediaPlayer/hook/useMediaPlayer";
import styles from "./index.module.css";

type MovieCardProps = {
  src: string;
  extension: string;
  isFullscreen?: boolean;
  onLoadError?: () => void;
  onToggleFullscreen?: () => void;
};

const getVideoMimeType = (extension: string): string => {
  switch (extension.trim().replace(/^\./, "").toLowerCase()) {
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    case "flv":
      return "video/x-flv";
    case "webm":
      return "video/webm";
    default:
      return "video/mp4";
  }
};

const MovieCard = ({
  src,
  extension,
  isFullscreen,
  onLoadError,
  onToggleFullscreen,
}: MovieCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    changeVolume,
  } = useMediaPlayer({ mediaRef: videoRef });
  const { isVisible, showControls, pinControls, unpinControls } =
    useAutoHideControls({ mediaRef: videoRef });

  return (
    <div
      className={styles["card-movie"]}
      onPointerMove={showControls}
      onPointerEnter={showControls}
    >
      <video
        ref={videoRef}
        className={styles["movie"]}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onError={onLoadError}
      >
        <source
          src={src}
          type={getVideoMimeType(extension)}
          onError={onLoadError}
        />
        <track kind="captions" />
      </video>
      <div
        className={styles["movie-controls"]}
        onPointerEnter={pinControls}
        onPointerLeave={unpinControls}
        onFocusCapture={pinControls}
        onBlurCapture={unpinControls}
      >
        <MediaPlayer
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isVisible={isVisible}
          isFullscreen={isFullscreen}
          downloadURL={src}
          downloadLabel="動画ファイルをダウンロード"
          onTogglePlay={togglePlay}
          onChangeVolume={changeVolume}
          onToggleFullscreen={onToggleFullscreen}
          onSeekRatio={(ratio) => seekTo(ratio * duration)}
        />
      </div>
    </div>
  );
};

export default MovieCard;
