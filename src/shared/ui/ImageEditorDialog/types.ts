import type { ImageCropArea } from "@/util/imageProcessing";

export type ImageEditState = {
  croppedAreaPercentages: ImageCropArea;
  rotation?: number;
};

export type ImageEditSettings = {
  aspect: number;
  longSide: number;
  cropShape: "rect" | "round";
};
