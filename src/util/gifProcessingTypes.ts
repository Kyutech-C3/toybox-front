import type { ImageCropArea } from "./imageProcessing";

export type GifProcessingRequest = {
  buffer: ArrayBuffer;
  area: ImageCropArea;
  size: { width: number; height: number };
  rotation: number;
};

export type GifProcessingResponse =
  | { type: "success"; buffer: ArrayBuffer }
  | { type: "error" };
