import { useEffect, useRef, useState } from "react";

import { getImageOutputSize } from "@/util/imageProcessing";

import type { RefObject } from "react";
import type { MediaSize, Point, Size } from "react-easy-crop";
import type { ImageCropArea } from "@/util/imageProcessing";
import type { ImageEditSettings, ImageEditState } from "../types";

type UseImageCropParams = {
  image: HTMLImageElement | null;
  settings: ImageEditSettings;
  initialEdit?: ImageEditState;
};

type UseImageCropReturn = {
  cropContainerRef: RefObject<HTMLDivElement | null>;
  cropSize: Size | null;
  crop: Point;
  zoom: number;
  rotation: number;
  initialCrop: ImageCropArea | undefined;
  cropVersion: number;
  area: ImageCropArea | null;
  percentages: ImageCropArea | null;
  outputSize: Size | null;
  setZoom: (zoom: number) => void;
  setMediaSize: (size: MediaSize) => void;
  handleCropAreaChange: (
    percentages: ImageCropArea,
    area: ImageCropArea,
  ) => void;
  handleReset: () => void;
  handleZoom: (change: number) => void;
  handleCropChange: (crop: Point) => void;
  handleRotation: (rotation: number) => void;
};

export const MAX_ZOOM = 10;
const MAX_IMAGE_OVERFLOW_RATIO = 0.25;

const useImageCrop = ({
  image,
  settings,
  initialEdit,
}: UseImageCropParams): UseImageCropReturn => {
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const mediaSizeRef = useRef<MediaSize | null>(null);
  const cropSizeRef = useRef<Size | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const cropZoomRef = useRef(zoom);
  const [rotation, setRotation] = useState(
    (((initialEdit?.rotation ?? 0) + 180) % 360) - 180,
  );
  const [initialCrop, setInitialCrop] = useState(
    initialEdit?.croppedAreaPercentages,
  );
  const [cropVersion, setCropVersion] = useState(0);
  const [area, setArea] = useState<ImageCropArea | null>(null);
  const [percentages, setPercentages] = useState<ImageCropArea | null>(null);
  const outputSize = area
    ? getImageOutputSize({
        area,
        longSide: settings.longSide,
        canUpscale: false,
      })
    : null;

  useEffect(() => {
    if (!image) {
      mediaSizeRef.current = null;
      cropSizeRef.current = null;
      setCropSize(null);
      setArea(null);
      return;
    }
    if (!cropContainerRef.current) return;
    const container = cropContainerRef.current;
    const updateCropSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      // 回転角には依存させず、元画像と編集領域の大きさから保存枠を決める。
      const scale = Math.min(
        1,
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const cropHeight = Math.min(
        image.naturalHeight * scale,
        (image.naturalWidth * scale) / settings.aspect,
      );
      const size = { width: cropHeight * settings.aspect, height: cropHeight };
      cropSizeRef.current = size;
      setCropSize((current) =>
        current?.width === size.width && current.height === size.height
          ? current
          : size,
      );
    };
    updateCropSize();
    const observer = new ResizeObserver(updateCropSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [image, settings.aspect]);

  const handleReset = () => {
    setInitialCrop(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
    setPercentages(null);
    setCropVersion((version) => version + 1);
  };

  const handleZoom = (change: number) => {
    setZoom((value) => Math.min(MAX_ZOOM, Math.max(1, value + change)));
  };

  const handleCropChange = (nextCrop: Point) => {
    // 回転時の位置補正を、ドラッグ用の移動制限で戻さない。
    if (
      nextCrop.x === crop.x &&
      nextCrop.y === crop.y &&
      cropZoomRef.current === zoom
    )
      return;
    cropZoomRef.current = zoom;
    const media = mediaSizeRef.current;
    const frame = cropSizeRef.current;
    if (!media || !frame) {
      setCrop(nextCrop);
      return;
    }
    const radians = (rotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    // 写真の向きで制限し、斜めに動かしても写真から離れすぎないようにする。
    const projectedWidth =
      Math.abs(cosine) * frame.width + Math.abs(sine) * frame.height;
    const projectedHeight =
      Math.abs(sine) * frame.width + Math.abs(cosine) * frame.height;
    const maxX = Math.max(
      0,
      (media.width * zoom - projectedWidth) / 2 +
        projectedWidth * MAX_IMAGE_OVERFLOW_RATIO,
    );
    const maxY = Math.max(
      0,
      (media.height * zoom - projectedHeight) / 2 +
        projectedHeight * MAX_IMAGE_OVERFLOW_RATIO,
    );
    const x = Math.min(
      maxX,
      Math.max(-maxX, nextCrop.x * cosine + nextCrop.y * sine),
    );
    const y = Math.min(
      maxY,
      Math.max(-maxY, -nextCrop.x * sine + nextCrop.y * cosine),
    );
    setCrop({
      x: x * cosine - y * sine,
      y: x * sine + y * cosine,
    });
  };

  const handleRotation = (value: number) => {
    const nextRotation = Math.min(180, Math.max(-180, value));
    if (nextRotation === rotation) return;
    const radians = ((nextRotation - rotation) * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    // 枠の中心を軸にするため、画像中心の移動量も同じ角度だけ回転する。
    setCrop(({ x, y }) => ({
      x: x * cosine - y * sine,
      y: x * sine + y * cosine,
    }));
    setRotation(nextRotation);
  };

  return {
    cropContainerRef,
    cropSize,
    crop,
    zoom,
    rotation,
    initialCrop,
    cropVersion,
    area,
    percentages,
    outputSize,
    setZoom,
    setMediaSize: (size) => {
      mediaSizeRef.current = size;
    },
    handleCropAreaChange: (croppedPercentages, pixels) => {
      setArea(pixels);
      setPercentages(croppedPercentages);
    },
    handleReset,
    handleZoom,
    handleCropChange,
    handleRotation,
  };
};

export default useImageCrop;
