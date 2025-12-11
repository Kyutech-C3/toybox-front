import { useEffect, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import ImgCard from "./ImgCard";
import styles from "./index.module.css";

import type { Asset } from "@/shared/types/work";

type AssetCarouselProps = {
  assets: Asset[];
};

const AssetCarousel = ({ assets }: AssetCarouselProps) => {
  const containerRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

      console.log({ scrollLeft, scrollWidth, clientWidth });
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
        {assets.map((asset, index) => {
          switch (asset.asset_type) {
            case "image":
              return (
                <li
                  key={`${asset.work_id}-asset-${index}`}
                  className={styles["asset-carousel"]}
                >
                  <ImgCard alt="asset-image" src={asset.url} />
                </li>
              );
            default:
              return null;
          }
        })}
      </ul>
    </div>
  );
};

export default AssetCarousel;
