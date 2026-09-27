import { useEffect, useState } from "react";

import styles from "./index.module.css";

import LoadingSpinner from "@/shared/ui/LoadingSpinner";

import type { ComponentPropsWithoutRef } from "react";

type LoadingImageProps = ComponentPropsWithoutRef<"img"> & {
  isIntrinsic?: boolean;
};

const LoadingImage = ({
  src,
  className,
  onLoad,
  onError,
  alt,
  isIntrinsic = false,
  ...props
}: LoadingImageProps) => {
  const [settledSrc, setSettledSrc] = useState<string>();
  const isLoading = !!src && settledSrc !== src;
  const [spinnerSrc, setSpinnerSrc] = useState<string>();

  useEffect(() => {
    setSpinnerSrc(undefined);
    if (!isLoading) return;
    const timer = window.setTimeout(() => setSpinnerSrc(src), 150);
    return () => window.clearTimeout(timer);
  }, [src, isLoading]);

  return (
    <span
      className={[styles["image-wrapper"], className].filter(Boolean).join(" ")}
      data-intrinsic={isIntrinsic}
      data-loading={isLoading}
    >
      <img
        {...props}
        src={src}
        alt={alt}
        className={styles["image"]}
        ref={(image) => {
          if (image?.complete && src) setSettledSrc(src);
        }}
        onLoad={(event) => {
          setSettledSrc(src);
          onLoad?.(event);
        }}
        onError={(event) => {
          setSettledSrc(src);
          onError?.(event);
        }}
      />
      {isLoading && spinnerSrc === src && (
        <span className={styles["loading-state"]}>
          <LoadingSpinner size="small" />
        </span>
      )}
    </span>
  );
};

export default LoadingImage;
