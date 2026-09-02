import { useCallback, useEffect, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";

import AssetNavigator from "./AssetNavigator";
import AudioCard from "./AudioCard";
import { getSafeAssetURL } from "./assetUrl";
import DownloadCard from "./DownloadCard";
import ImgCard from "./ImgCard";
import styles from "./index.module.css";
import MovieCard from "./MovieCard";

import type { Asset } from "@/shared/types/work";

type AssetCarouselProps = {
  assets: Asset[];
};

const SEEK_STEP_SECONDS = 5;

const AssetCarousel = ({ assets }: AssetCarouselProps) => {
  const containerRef = useRef<HTMLUListElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedAssetIDs, setFailedAssetIDs] = useState<Set<string>>(
    () => new Set(),
  );
  const isPointerInsideRef = useRef(false);
  const handleFullscreenRef = useRef<() => Promise<void>>(async () => {});
  const activeAssetIndexRef = useRef(0);
  const isRestoringRef = useRef(false);
  const lastWidthRef = useRef(0);

  const applyActiveAssetIndex = useCallback((assetIndex: number) => {
    activeAssetIndexRef.current = assetIndex;
    setActiveAssetIndex(assetIndex);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewportRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    lastWidthRef.current = container.clientWidth;
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      if (width === 0 || width === lastWidthRef.current) return;

      lastWidthRef.current = width;
      isRestoringRef.current = true;
      container.scrollTo({
        left: activeAssetIndexRef.current * width,
        behavior: "instant",
      });
      window.requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateActiveAssetIndex = () => {
      if (isRestoringRef.current) return;
      if (container.clientWidth !== lastWidthRef.current) return;

      if (assets.length <= 1) {
        applyActiveAssetIndex(0);
        return;
      }

      const scrollLeft = container.scrollLeft;
      const clientWidth = container.clientWidth;
      const nextActiveAssetIndex =
        clientWidth > 0 ? Math.round(scrollLeft / clientWidth) : 0;

      applyActiveAssetIndex(
        Math.min(Math.max(nextActiveAssetIndex, 0), assets.length - 1),
      );
    };

    updateActiveAssetIndex();
    container.addEventListener("scroll", updateActiveAssetIndex);

    return () => {
      container.removeEventListener("scroll", updateActiveAssetIndex);
    };
  }, [assets.length, applyActiveAssetIndex]);

  const scrollToAsset = (assetIndex: number) => {
    const container = containerRef.current;
    if (!container) return;

    applyActiveAssetIndex(assetIndex);
    container.scrollTo({
      left: assetIndex * container.clientWidth,
      behavior: "smooth",
    });
  };

  const scroll = (direction: "left" | "right") => {
    if (assets.length === 0) return;

    const offset = direction === "left" ? -1 : 1;
    const nextAssetIndex =
      (activeAssetIndex + offset + assets.length) % assets.length;
    scrollToAsset(nextAssetIndex);
  };

  const handleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await document.exitFullscreen();
        return;
      }

      await viewportRef.current?.requestFullscreen();
    } catch {}
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = [...container.children];
    for (let index = 0; index < items.length; index += 1) {
      if (index === activeAssetIndex) continue;

      const media =
        items[index].querySelector<HTMLMediaElement>("audio, video");
      if (media && !media.paused) media.pause();
    }
  }, [activeAssetIndex]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const isPointerInside = isPointerInsideRef.current;
      const isFocusInside = viewport.contains(document.activeElement);
      if (!isFullscreen && !isPointerInside && !isFocusInside) return;

      const active = document.activeElement as HTMLElement | null;
      if (
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.isContentEditable
      ) {
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        void handleFullscreenRef.current();
        return;
      }

      const isOnControl =
        !isPointerInside &&
        !!(event.target as HTMLElement | null)?.closest(
          "button, a, input, textarea",
        );

      const media = viewport.querySelector<HTMLMediaElement>(
        "li[data-active='true'] audio, li[data-active='true'] video",
      );
      if (!media) return;

      if (event.key === " ") {
        if (isOnControl) return;
        event.preventDefault();
        if (media.paused) void media.play().catch(() => undefined);
        else media.pause();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (isOnControl) return;
        event.preventDefault();
        const offset =
          event.key === "ArrowRight" ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS;
        const limit = Number.isFinite(media.duration)
          ? media.duration
          : media.currentTime;
        media.currentTime = Math.min(
          Math.max(media.currentTime + offset, 0),
          limit,
        );
      }
    };

    const handlePointerEnter = () => {
      isPointerInsideRef.current = true;
    };
    const handlePointerLeave = () => {
      isPointerInsideRef.current = false;
    };

    const viewport = viewportRef.current;
    viewport?.addEventListener("pointerenter", handlePointerEnter);
    viewport?.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      viewport?.removeEventListener("pointerenter", handlePointerEnter);
      viewport?.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  handleFullscreenRef.current = handleFullscreen;

  const handleLoadError = (assetID: string) => {
    setFailedAssetIDs((currentAssetIDs) => {
      const nextAssetIDs = new Set(currentAssetIDs);
      nextAssetIDs.add(assetID);
      return nextAssetIDs;
    });
  };

  const activeAsset = assets[activeAssetIndex];
  const isFullscreenAvailable =
    !!activeAsset &&
    activeAsset.asset_type === "image" &&
    !failedAssetIDs.has(activeAsset.id);
  const FullscreenIcon = isFullscreen
    ? FullscreenExitRoundedIcon
    : FullscreenRoundedIcon;

  return (
    <div className={styles["asset-wrapper"]}>
      <div className={styles["carousel-viewport"]} ref={viewportRef}>
        {assets.length > 1 && (
          <>
            <button
              className={styles["scroll-left-button"]}
              onClick={() => scroll("left")}
              aria-label="前のアセットを表示"
              type="button"
            >
              <ChevronLeftRoundedIcon fontSize="large" />
            </button>
            <button
              className={styles["scroll-right-button"]}
              onClick={() => scroll("right")}
              aria-label="次のアセットを表示"
              type="button"
            >
              <ChevronRightRoundedIcon fontSize="large" />
            </button>
          </>
        )}
        {isFullscreenAvailable && (
          <button
            className={styles["fullscreen-button"]}
            type="button"
            aria-label={isFullscreen ? "全画面表示を終了" : "画像を全画面表示"}
            onClick={handleFullscreen}
          >
            <FullscreenIcon aria-hidden="true" fontSize="large" />
          </button>
        )}
        <ul className={styles["asset-container"]} ref={containerRef}>
          {assets.map((asset) => {
            const isLoadError = failedAssetIDs.has(asset.id);
            const safeURL = getSafeAssetURL(asset.url);

            if (isLoadError || !safeURL) {
              return (
                <li
                  key={asset.id}
                  className={styles["asset-carousel"]}
                  data-active={assets[activeAssetIndex]?.id === asset.id}
                >
                  <DownloadCard
                    assetType={asset.asset_type}
                    extension={asset.extension}
                    isLoadError={isLoadError}
                    url={asset.url}
                  />
                </li>
              );
            }

            switch (asset.asset_type) {
              case "image":
                return (
                  <li
                    key={asset.id}
                    className={styles["asset-carousel"]}
                    data-active={assets[activeAssetIndex]?.id === asset.id}
                  >
                    <ImgCard
                      alt="作品のアセット画像"
                      src={safeURL}
                      onLoadError={() => handleLoadError(asset.id)}
                    />
                  </li>
                );
              case "video":
                return (
                  <li
                    key={asset.id}
                    className={styles["asset-carousel"]}
                    data-active={assets[activeAssetIndex]?.id === asset.id}
                  >
                    <MovieCard
                      src={safeURL}
                      extension={asset.extension}
                      isFullscreen={isFullscreen}
                      onLoadError={() => handleLoadError(asset.id)}
                      onToggleFullscreen={() => void handleFullscreen()}
                    />
                  </li>
                );
              case "music":
                return (
                  <li
                    key={asset.id}
                    className={styles["asset-carousel"]}
                    data-active={assets[activeAssetIndex]?.id === asset.id}
                  >
                    <AudioCard
                      src={safeURL}
                      extension={asset.extension}
                      isFullscreen={isFullscreen}
                      onLoadError={() => handleLoadError(asset.id)}
                      onToggleFullscreen={() => void handleFullscreen()}
                    />
                  </li>
                );
              case "zip":
                return (
                  <li
                    key={asset.id}
                    className={styles["asset-carousel"]}
                    data-active={assets[activeAssetIndex]?.id === asset.id}
                  >
                    <DownloadCard
                      assetType={asset.asset_type}
                      extension={asset.extension}
                      url={safeURL}
                    />
                  </li>
                );
              default:
                return (
                  <li
                    key={asset.id}
                    className={styles["asset-carousel"]}
                    data-active={assets[activeAssetIndex]?.id === asset.id}
                  >
                    <DownloadCard
                      assetType={asset.asset_type}
                      extension={asset.extension}
                      url={safeURL}
                    />
                  </li>
                );
            }
          })}
        </ul>
      </div>
      {assets.length > 1 && (
        <AssetNavigator
          assets={assets}
          activeAssetIndex={activeAssetIndex}
          failedAssetIDs={failedAssetIDs}
          onSelect={scrollToAsset}
        />
      )}
    </div>
  );
};

export default AssetCarousel;
