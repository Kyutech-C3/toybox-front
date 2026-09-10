import { useCallback, useEffect, useRef, useState } from "react";

import type { CSSProperties } from "react";

const MARQUEE_SPEED = 50;
const MARQUEE_GAP = 40;
const MARQUEE_START_DELAY = 0.4;
const MARQUEE_RESUME_DELAY_MS = 7000;

type MarqueeState = "off" | "running" | "paused";

type MarqueeStyle = CSSProperties & {
  "--marquee-gap"?: string;
  "--marquee-shift"?: string;
  "--marquee-duration"?: string;
  "--marquee-delay"?: string;
  "--marquee-offset"?: string;
};

type UseMarqueeReturn = {
  setContainer: (element: HTMLElement | null) => void;
  setContent: (element: HTMLElement | null) => void;
  setItem: (element: HTMLElement | null) => void;
  isOverflowing: boolean;
  marqueeState: MarqueeState;
  marqueeStyle: MarqueeStyle;
  measure: () => void;
  scrollBy: (delta: number) => boolean;
  reset: () => void;
};

const wrapOffset = (offset: number, shift: number) =>
  ((offset % shift) + shift) % shift;

const getMarqueeState = (
  isOverflowing: boolean,
  isPaused: boolean,
): MarqueeState => {
  if (!isOverflowing) return "off";
  return isPaused ? "paused" : "running";
};

const readAnimatedOffset = (content: HTMLElement | null, shift: number) => {
  if (!content) return 0;

  const { transform } = getComputedStyle(content);
  if (transform === "none") return 0;

  const translateX = new DOMMatrixReadOnly(transform).m41;
  return wrapOffset(-translateX, shift);
};

const useMarquee = (): UseMarqueeReturn => {
  const containerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const itemRef = useRef<HTMLElement | null>(null);
  const shiftRef = useRef(0);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);
  const [shift, setShift] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  const setContent = useCallback((element: HTMLElement | null) => {
    contentRef.current = element;
  }, []);

  const setItem = useCallback((element: HTMLElement | null) => {
    itemRef.current = element;
  }, []);

  const measure = useCallback(() => {
    const item = itemRef.current;
    const container = containerRef.current;
    const nextShift =
      !item || !container || item.scrollWidth <= container.clientWidth
        ? 0
        : item.scrollWidth + MARQUEE_GAP;

    shiftRef.current = nextShift;
    setShift(nextShift);
    return nextShift;
  }, []);

  const scrollBy = useCallback(
    (delta: number) => {
      const currentShift = shiftRef.current > 0 ? shiftRef.current : measure();
      if (currentShift <= 0) return false;

      const currentOffset = isPausedRef.current
        ? offsetRef.current
        : readAnimatedOffset(contentRef.current, currentShift);
      const nextOffset = wrapOffset(currentOffset + delta, currentShift);

      offsetRef.current = nextOffset;
      isPausedRef.current = true;
      setOffset(nextOffset);
      setIsPaused(true);

      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = window.setTimeout(() => {
        resumeTimeoutRef.current = undefined;
        isPausedRef.current = false;
        setIsPaused(false);
      }, MARQUEE_RESUME_DELAY_MS);

      return true;
    },
    [measure],
  );

  const reset = useCallback(() => {
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = undefined;
    offsetRef.current = 0;
    isPausedRef.current = false;
    setOffset(0);
    setIsPaused(false);
  }, []);

  useEffect(() => () => window.clearTimeout(resumeTimeoutRef.current), []);

  const isOverflowing = shift > 0;
  const marqueeStyle: MarqueeStyle = isOverflowing
    ? {
        "--marquee-gap": `${MARQUEE_GAP}px`,
        "--marquee-shift": `${-shift}px`,
        "--marquee-duration": `${shift / MARQUEE_SPEED}s`,
        "--marquee-delay": `${offset > 0 ? -(offset / MARQUEE_SPEED) : MARQUEE_START_DELAY}s`,
        "--marquee-offset": `${-offset}px`,
      }
    : {};

  return {
    setContainer,
    setContent,
    setItem,
    isOverflowing,
    marqueeState: getMarqueeState(isOverflowing, isPaused),
    marqueeStyle,
    measure,
    scrollBy,
    reset,
  };
};

export default useMarquee;
