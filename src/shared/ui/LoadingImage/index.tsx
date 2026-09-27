import { useState } from "react";

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

  return (
    <span
      className={[styles["image-wrapper"], className].filter(Boolean).join(" ")}
      data-intrinsic={isIntrinsic}
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
      {isLoading && (
        <span className={styles["loading-state"]}>
          <LoadingSpinner size="small" />
        </span>
      )}
    </span>
  );
};

export default LoadingImage;
