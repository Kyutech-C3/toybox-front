import { useRef } from "react";

import CardWrapper from "../CardWrapper";
import MediaPlayer from "../MediaPlayer";
import useAutoHideControls from "../MediaPlayer/hook/useAutoHideControls";
import useMediaPlayer from "../MediaPlayer/hook/useMediaPlayer";
import styles from "./index.module.css";

type AudioCardProps = {
  src: string;
  extension: string;
  isFullscreen?: boolean;
  onLoadError?: () => void;
  onToggleFullscreen?: () => void;
};

const getAudioMimeType = (extension: string): string => {
  switch (extension) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/mp4";
    case "ogg":
      return "audio/ogg";
    case "aac":
      return "audio/aac";
    default:
      return "audio/mpeg";
  }
};

const AudioCard = ({
  src,
  extension,
  isFullscreen,
  onLoadError,
  onToggleFullscreen,
}: AudioCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    changeVolume,
  } = useMediaPlayer({ mediaRef: audioRef });
  const { isVisible, showControls, pinControls, unpinControls } =
    useAutoHideControls({ mediaRef: audioRef });

  const playedRatio = duration > 0 ? currentTime / duration : 0;
  const handleSeekRatio = (ratio: number) => seekTo(ratio * duration);

  return (
    <CardWrapper>
      <div
        className={styles["card-audio"]}
        onPointerMove={showControls}
        onPointerEnter={showControls}
      >
        <audio ref={audioRef} preload="metadata">
          <source
            src={src}
            type={getAudioMimeType(extension)}
            onError={onLoadError}
          />
          <track kind="captions" />
        </audio>
        <div className={styles["waveform-fallback"]} aria-hidden="true">
          <span
            className={styles["waveform-fallback-played"]}
            style={{ width: `${playedRatio * 100}%` }}
          />
        </div>
        <div
          className={styles["audio-controls"]}
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
            downloadLabel="音声ファイルをダウンロード"
            onTogglePlay={togglePlay}
            onChangeVolume={changeVolume}
            onSeekRatio={handleSeekRatio}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>
      </div>
    </CardWrapper>
  );
};

export default AudioCard;
