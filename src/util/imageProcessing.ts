export type ImageCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageOutputSizeParams = {
  area: ImageCropArea;
  longSide: number;
  canUpscale: boolean;
};

export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.bmp,.gif,.webp";
export const MAX_IMAGE_OUTPUT_SIDE = 4096;

export const getImageOutputSize = ({
  area,
  longSide,
  canUpscale,
}: ImageOutputSizeParams) => {
  const sourceLongSide = Math.max(area.width, area.height);
  const targetLongSide = Math.min(
    longSide,
    MAX_IMAGE_OUTPUT_SIDE,
    canUpscale ? Number.POSITIVE_INFINITY : sourceLongSide,
  );
  const scale = targetLongSide / sourceLongSide;
  return {
    width: Math.max(1, Math.floor(area.width * scale)),
    height: Math.max(1, Math.floor(area.height * scale)),
  };
};

export const drawImageCrop = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  area: ImageCropArea,
  size: { width: number; height: number },
) => {
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像の加工に対応していません");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size.width,
    size.height,
  );
};

type CreateEditedImageParams = {
  image: HTMLImageElement;
  area: ImageCropArea;
  size: { width: number; height: number };
  fileName: string;
};

export const createEditedImage = async ({
  image,
  area,
  size,
  fileName,
}: CreateEditedImageParams): Promise<File> => {
  const canvas = document.createElement("canvas");
  drawImageCrop(canvas, image, area, size);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("画像を作成できませんでした"));
      },
      "image/webp",
      0.9,
    );
  });
  const extension = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `${fileName.replace(/\.[^.]+$/, "")}.${extension}`, {
    type: blob.type,
  });
};
