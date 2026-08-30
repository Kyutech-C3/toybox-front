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

      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
    };
  }, [assets.length]);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
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
      {assets.length > 1 && (
        <>
          <button
            className={styles["scroll-left-button"]}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            data-disabled={!canScrollLeft}
            aria-label="前へ"
            type="button"
          >
            <ChevronLeftRoundedIcon fontSize="large" />
          </button>
          <button
            className={styles["scroll-right-button"]}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            data-disabled={!canScrollRight}
            aria-label="次へ"
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
  );
};

export default AssetCarousel;
