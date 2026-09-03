import { useId, useMemo, useRef } from "react";

import CardWrapper from "../CardWrapper";
import MediaPlayer from "../MediaPlayer";
import useAutoHideControls from "../MediaPlayer/hook/useAutoHideControls";
import useMediaPlayer from "../MediaPlayer/hook/useMediaPlayer";
import useSeekDrag from "../MediaPlayer/hook/useSeekDrag";
import useAudioWaveform from "./hook/useAudioWaveform";
import styles from "./index.module.css";

type AudioCardProps = {
  src: string;
  extension: string;
  isFullscreen?: boolean;
  onLoadError?: () => void;
  onToggleFullscreen?: () => void;
};

const WAVEFORM_BAR_COUNT = 160;
const WAVEFORM_VIEW_HEIGHT = 100;
const WAVEFORM_MAX_HEIGHT = WAVEFORM_VIEW_HEIGHT;
const WAVEFORM_MIN_HEIGHT = 2;

const getAudioMimeType = (extension: string): string => {
  switch (extension.trim().replace(/^\./, "").toLowerCase()) {
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

const buildWaveformPath = (peaks: number[]) =>
  peaks
    .map((peak, index) => {
      const height = Math.max(peak * WAVEFORM_MAX_HEIGHT, WAVEFORM_MIN_HEIGHT);
      const center = WAVEFORM_VIEW_HEIGHT / 2;
      return `M${index + 0.5} ${center - height / 2}V${center + height / 2}`;
    })
    .join("");

const AudioCard = ({
  src,
  extension,
  isFullscreen,
  onLoadError,
  onToggleFullscreen,
}: AudioCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const clipID = useId();
  const { peaks } = useAudioWaveform({ src, barCount: WAVEFORM_BAR_COUNT });
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
  const waveformSeekHandlers = useSeekDrag({ onSeekRatio: handleSeekRatio });
  const waveformPath = useMemo(() => buildWaveformPath(peaks), [peaks]);

  return (
    <CardWrapper>
      <div
        className={styles["card-audio"]}
        onPointerMove={showControls}
        onPointerEnter={showControls}
      >
        <audio ref={audioRef} preload="metadata" onError={onLoadError}>
          <source
            src={src}
            type={getAudioMimeType(extension)}
            onError={onLoadError}
          />
          <track kind="captions" />
        </audio>
        {peaks.length > 0 ? (
          <svg
            className={styles["waveform"]}
            viewBox={`0 0 ${peaks.length} ${WAVEFORM_VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            role="presentation"
            {...waveformSeekHandlers}
          >
            <title>音声の波形</title>
            <defs>
              <clipPath id={clipID}>
                <rect
                  x="0"
                  y="0"
                  width={peaks.length * playedRatio}
                  height={WAVEFORM_VIEW_HEIGHT}
                />
              </clipPath>
            </defs>
            <path className={styles["waveform-line"]} d={waveformPath} />
            <path
              className={styles["waveform-line-played"]}
              d={waveformPath}
              clipPath={`url(#${clipID})`}
            />
          </svg>
        ) : (
          <div
            className={styles["waveform-fallback"]}
            role="presentation"
            {...waveformSeekHandlers}
          >
            <span
              className={styles["waveform-fallback-played"]}
              style={{ width: `${playedRatio * 100}%` }}
            />
          </div>
        )}
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
