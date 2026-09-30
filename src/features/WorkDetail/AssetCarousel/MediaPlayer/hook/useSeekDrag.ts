import { useCallback } from "react";

import type { PointerEvent } from "react";

type UseSeekDragParams = {
  onSeekRatio: (ratio: number) => void;
};

type UseSeekDragReturn = {
  onPointerDown: (event: PointerEvent<Element>) => void;
  onPointerMove: (event: PointerEvent<Element>) => void;
  onPointerUp: (event: PointerEvent<Element>) => void;
};

const useSeekDrag = ({ onSeekRatio }: UseSeekDragParams): UseSeekDragReturn => {
  const seekFromEvent = useCallback(
    (event: PointerEvent<Element>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0) return;

      const ratio = (event.clientX - rect.left) / rect.width;
      onSeekRatio(Math.min(Math.max(ratio, 0), 1));
    },
    [onSeekRatio],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<Element>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      seekFromEvent(event);
    },
    [seekFromEvent],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<Element>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      seekFromEvent(event);
    },
    [seekFromEvent],
  );

  const onPointerUp = useCallback((event: PointerEvent<Element>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
};

export default useSeekDrag;
