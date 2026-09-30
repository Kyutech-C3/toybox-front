import { useCallback, useEffect, useRef, useState } from "react";

import type { RefObject } from "react";

type UseAutoHideControlsParams = {
  mediaRef: RefObject<HTMLMediaElement | null>;
  hideDelayMs?: number;
};

type UseAutoHideControlsReturn = {
  isVisible: boolean;
  showControls: () => void;
  pinControls: () => void;
  unpinControls: () => void;
};

const DEFAULT_HIDE_DELAY_MS = 2000;
const useAutoHideControls = ({
  mediaRef,
  hideDelayMs = DEFAULT_HIDE_DELAY_MS,
}: UseAutoHideControlsParams): UseAutoHideControlsReturn => {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<number | undefined>(undefined);
  const isPinnedRef = useRef(false);

  const scheduleHide = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    if (isPinnedRef.current) return;

    timeoutRef.current = window.setTimeout(
      () => setIsVisible(false),
      hideDelayMs,
    );
  }, [hideDelayMs]);

  const showControls = useCallback(() => {
    setIsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const pinControls = useCallback(() => {
    isPinnedRef.current = true;
    window.clearTimeout(timeoutRef.current);
    setIsVisible(true);
  }, []);

  const unpinControls = useCallback(() => {
    isPinnedRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const events = ["play", "pause", "seeked", "volumechange"] as const;
    for (const event of events) media.addEventListener(event, showControls);

    return () => {
      for (const event of events)
        media.removeEventListener(event, showControls);
    };
  }, [mediaRef, showControls]);

  useEffect(() => {
    scheduleHide();
    return () => window.clearTimeout(timeoutRef.current);
  }, [scheduleHide]);

  return { isVisible, showControls, pinControls, unpinControls };
};

export default useAutoHideControls;
