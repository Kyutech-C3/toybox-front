import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";

import styles from "./index.module.css";

type MediaPlayerProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isVisible?: boolean;
  downloadURL?: string;
  downloadLabel: string;
  isFullscreen?: boolean;
  onTogglePlay: () => void;
  onChangeVolume: (volume: number) => void;
  onSeekRatio: (ratio: number) => void;
  onToggleFullscreen?: () => void;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
};

const MediaPlayer = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isVisible = true,
  downloadURL,
  downloadLabel,
  isFullscreen = false,
  onTogglePlay,
  onChangeVolume,
  onSeekRatio,
  onToggleFullscreen,
}: MediaPlayerProps) => {
  const progressMax = duration > 0 ? duration : 1;
  const progressValue = Math.min(currentTime, progressMax);

  return (
    <div
      className={styles["media-player"]}
      data-visible={isVisible ? "true" : "false"}
    >
      <button
        type="button"
        className={styles["play-button"]}
        onClick={onTogglePlay}
        aria-label={isPlaying ? "一時停止" : "再生"}
        title={isPlaying ? "一時停止" : "再生"}
      >
        {isPlaying ? (
          <PauseRoundedIcon fontSize="inherit" />
        ) : (
          <PlayArrowRoundedIcon fontSize="inherit" />
        )}
      </button>
      <div className={styles["progress-area"]}>
        <input
          type="range"
          className={styles["progress"]}
          min={0}
          max={progressMax}
          step={0.1}
          value={progressValue}
          disabled={duration <= 0}
          aria-label="再生位置"
          aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
          onChange={(event) =>
            onSeekRatio(Number(event.target.value) / progressMax)
          }
        />
        <p className={styles["time"]}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </p>
      </div>
      <div className={styles["volume-area"]}>
        <button
          type="button"
          className={styles["volume-button"]}
          onClick={() => onChangeVolume(volume === 0 ? 1 : 0)}
          aria-label={volume === 0 ? "ミュートを解除" : "ミュートにする"}
          title={volume === 0 ? "ミュートを解除" : "ミュートにする"}
        >
          {volume === 0 ? (
            <VolumeOffRoundedIcon fontSize="inherit" />
          ) : (
            <VolumeUpRoundedIcon fontSize="inherit" />
          )}
        </button>
        <input
          type="range"
          className={styles["volume-range"]}
          min={0}
          max={1}
          step={0.01}
          value={volume}
          aria-label="音量"
          onChange={(event) => onChangeVolume(Number(event.target.value))}
        />
      </div>
      {downloadURL && (
        <a
          className={styles["download-link"]}
          href={downloadURL}
          target="_blank"
          rel="noopener noreferrer"
          download
          aria-label={downloadLabel}
          title="ダウンロード"
        >
          <DownloadRoundedIcon fontSize="inherit" />
        </a>
      )}
      {onToggleFullscreen && (
        <button
          type="button"
          className={styles["fullscreen-button"]}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "全画面表示を終了" : "全画面表示にする"}
          title={isFullscreen ? "全画面表示を終了" : "全画面表示にする"}
        >
          {isFullscreen ? (
            <FullscreenExitRoundedIcon fontSize="inherit" />
          ) : (
            <FullscreenRoundedIcon fontSize="inherit" />
          )}
        </button>
      )}
    </div>
  );
};

export default MediaPlayer;
