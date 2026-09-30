import { useEffect, useRef } from "react";

import type { RefObject } from "react";

type ScrollPane = "source" | "preview";

type UseLiveScrollSyncParams = {
  isEnabled: boolean;
};

type UseLiveScrollSyncReturn = {
  sourceRef: RefObject<HTMLDivElement | null>;
  previewRef: RefObject<HTMLDivElement | null>;
};

/**
 * Live Mode の原文ペインとプレビューペインについて、
 * 表示領域の中央に来ている位置が揃うようにスクロール量を同期する。
 * 原文と変換後で行の高さが異なるため、位置は全体に対する比率で近似する。
 */
const useLiveScrollSync = ({
  isEnabled,
}: UseLiveScrollSyncParams): UseLiveScrollSyncReturn => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // 同期による scroll イベントで往復しないよう、操作中のペインだけを起点にする
  const activePaneRef = useRef<ScrollPane | null>(null);

  useEffect(() => {
    const source = sourceRef.current;
    const preview = previewRef.current;
    if (!isEnabled || !source || !preview) return;

    const syncScroll = (from: HTMLElement, to: HTMLElement) => {
      const toScrollableHeight = to.scrollHeight - to.clientHeight;
      if (from.scrollHeight <= from.clientHeight || toScrollableHeight <= 0) {
        return;
      }

      const centerRatio =
        (from.scrollTop + from.clientHeight / 2) / from.scrollHeight;
      const nextScrollTop = centerRatio * to.scrollHeight - to.clientHeight / 2;
      to.scrollTop = Math.min(Math.max(nextScrollTop, 0), toScrollableHeight);
    };

    const handleSourceScroll = () => {
      if (activePaneRef.current !== "source") return;
      syncScroll(source, preview);
    };

    const handlePreviewScroll = () => {
      if (activePaneRef.current !== "preview") return;
      syncScroll(preview, source);
    };

    const activateSource = () => {
      activePaneRef.current = "source";
    };

    const activatePreview = () => {
      activePaneRef.current = "preview";
    };

    source.addEventListener("scroll", handleSourceScroll, { passive: true });
    preview.addEventListener("scroll", handlePreviewScroll, { passive: true });
    source.addEventListener("pointerenter", activateSource);
    source.addEventListener("focusin", activateSource);
    preview.addEventListener("pointerenter", activatePreview);
    preview.addEventListener("focusin", activatePreview);

    return () => {
      source.removeEventListener("scroll", handleSourceScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
      source.removeEventListener("pointerenter", activateSource);
      source.removeEventListener("focusin", activateSource);
      preview.removeEventListener("pointerenter", activatePreview);
      preview.removeEventListener("focusin", activatePreview);
      activePaneRef.current = null;
    };
  }, [isEnabled]);

  return { sourceRef, previewRef };
};

export default useLiveScrollSync;
