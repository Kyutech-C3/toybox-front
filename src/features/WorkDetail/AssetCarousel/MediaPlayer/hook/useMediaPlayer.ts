import { useCallback, useEffect, useState } from "react";

import type { RefObject } from "react";

type UseMediaPlayerParams = {
  mediaRef: RefObject<HTMLMediaElement | null>;
};

type UseMediaPlayerReturn = {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  seekBy: (offset: number) => void;
  changeVolume: (volume: number) => void;
};

const useMediaPlayer = ({
  mediaRef,
}: UseMediaPlayerParams): UseMediaPlayerReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleDurationChange = () => {
      setDuration(Number.isFinite(media.duration) ? media.duration : 0);
    };
    const handleVolumeChange = () => setVolume(media.muted ? 0 : media.volume);

    handleDurationChange();
    handleVolumeChange();
    setIsLoading(
      media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA && !media.error,
    );
    const handleLoadStart = () => setIsLoading(true);
    const handleReady = () => setIsLoading(false);
    const loadingEvents = ["loadstart", "waiting", "seeking"];
    const readyEvents = [
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "playing",
      "seeked",
      "error",
      "abort",
      "emptied",
    ];
    for (const event of loadingEvents)
      media.addEventListener(event, handleLoadStart);
    for (const event of readyEvents) media.addEventListener(event, handleReady);

    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handlePause);
    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("durationchange", handleDurationChange);
    media.addEventListener("loadedmetadata", handleDurationChange);
    media.addEventListener("volumechange", handleVolumeChange);

    return () => {
      for (const event of loadingEvents)
        media.removeEventListener(event, handleLoadStart);
      for (const event of readyEvents)
        media.removeEventListener(event, handleReady);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handlePause);
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("durationchange", handleDurationChange);
      media.removeEventListener("loadedmetadata", handleDurationChange);
      media.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [mediaRef]);

  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      void media.play().catch(() => undefined);
      return;
    }
    media.pause();
  }, [mediaRef]);

  const seekTo = useCallback(
    (time: number) => {
      const media = mediaRef.current;
      if (!media || !Number.isFinite(media.duration)) return;

      media.currentTime = Math.min(Math.max(time, 0), media.duration);
      setCurrentTime(media.currentTime);
    },
    [mediaRef],
  );

  const seekBy = useCallback(
    (offset: number) => {
      const media = mediaRef.current;
      if (!media) return;
      seekTo(media.currentTime + offset);
    },
    [mediaRef, seekTo],
  );

  const changeVolume = useCallback(
    (nextVolume: number) => {
      const media = mediaRef.current;
      if (!media) return;

      const clamped = Math.min(Math.max(nextVolume, 0), 1);
      media.muted = clamped === 0;
      media.volume = clamped;
      setVolume(clamped);
    },
    [mediaRef],
  );

  return {
    isLoading,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    seekBy,
    changeVolume,
  };
};

export default useMediaPlayer;
