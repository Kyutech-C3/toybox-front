import { useEffect, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

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

const AssetCarousel = ({ assets }: AssetCarouselProps) => {
  const containerRef = useRef<HTMLUListElement>(null);
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [failedAssetIDs, setFailedAssetIDs] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      if (assets.length <= 1) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const nextActiveAssetIndex =
        clientWidth > 0 ? Math.round(scrollLeft / clientWidth) : 0;

      setActiveAssetIndex(
        Math.min(Math.max(nextActiveAssetIndex, 0), assets.length - 1),
      );
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
    };
  }, [assets.length]);

  const scrollToAsset = (assetIndex: number) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      left: assetIndex * container.clientWidth,
      behavior: "smooth",
    });
  };

  const scroll = (direction: "left" | "right") => {
    const nextAssetIndex =
      direction === "left" ? activeAssetIndex - 1 : activeAssetIndex + 1;
    scrollToAsset(Math.min(Math.max(nextAssetIndex, 0), assets.length - 1));
  };

  const handleLoadError = (assetID: string) => {
    setFailedAssetIDs((currentAssetIDs) => {
      const nextAssetIDs = new Set(currentAssetIDs);
      nextAssetIDs.add(assetID);
      return nextAssetIDs;
    });
  };

  return (
    <div className={styles["asset-wrapper"]}>
      <div className={styles["carousel-viewport"]}>
        {assets.length > 1 && (
          <>
            <button
              className={styles["scroll-left-button"]}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              data-disabled={!canScrollLeft}
              aria-label="前のアセットを表示"
              type="button"
            >
              <ChevronLeftRoundedIcon fontSize="large" />
            </button>
            <button
              className={styles["scroll-right-button"]}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              data-disabled={!canScrollRight}
              aria-label="次のアセットを表示"
              type="button"
            >
              <ChevronRightRoundedIcon fontSize="large" />
            </button>
          </>
        )}
        <ul className={styles["asset-container"]} ref={containerRef}>
          {assets.map((asset) => {
            const isLoadError = failedAssetIDs.has(asset.id);
            const safeURL = getSafeAssetURL(asset.url);

            if (isLoadError || !safeURL) {
              return (
                <li key={asset.id} className={styles["asset-carousel"]}>
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
                  <li key={asset.id} className={styles["asset-carousel"]}>
                    <ImgCard
                      alt="作品のアセット画像"
                      src={safeURL}
                      onLoadError={() => handleLoadError(asset.id)}
                    />
                  </li>
                );
              case "video":
                return (
                  <li key={asset.id} className={styles["asset-carousel"]}>
                    <MovieCard
                      src={safeURL}
                      extension={asset.extension}
                      onLoadError={() => handleLoadError(asset.id)}
                    />
                  </li>
                );
              case "music":
                return (
                  <li key={asset.id} className={styles["asset-carousel"]}>
                    <AudioCard
                      src={safeURL}
                      extension={asset.extension}
                      onLoadError={() => handleLoadError(asset.id)}
                    />
                  </li>
                );
              case "zip":
                return (
                  <li key={asset.id} className={styles["asset-carousel"]}>
                    <DownloadCard
                      assetType={asset.asset_type}
                      extension={asset.extension}
                      url={safeURL}
                    />
                  </li>
                );
              default:
                return (
                  <li key={asset.id} className={styles["asset-carousel"]}>
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
        <fieldset
          className={styles["asset-indicators"]}
          aria-label="アセットの表示位置"
        >
          {assets.map((asset, assetIndex) => (
            <button
              key={asset.id}
              className={styles["asset-indicator"]}
              type="button"
              data-active={assetIndex === activeAssetIndex}
              aria-current={
                assetIndex === activeAssetIndex ? "true" : undefined
              }
              aria-label={`${assetIndex + 1}番目のアセットを表示`}
              onClick={() => scrollToAsset(assetIndex)}
            />
          ))}
        </fieldset>
      )}
    </div>
  );
};

export default AssetCarousel;
