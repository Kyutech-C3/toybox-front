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

export const IMAGE_EDIT_SETTINGS = {
  avatar: { aspect: 1, longSide: 256, cropShape: "round" },
  thumbnail: { aspect: 4 / 3, longSide: 800, cropShape: "rect" },
} as const;

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
  // 倍率を先に求めると512pxが511.999…になるため、乗算してから割る。
  return {
    width: Math.max(
      1,
      Math.floor((area.width * targetLongSide) / sourceLongSide),
    ),
    height: Math.max(
      1,
      Math.floor((area.height * targetLongSide) / sourceLongSide),
    ),
  };
};

export const drawImageCrop = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  image: HTMLImageElement | OffscreenCanvas,
  area: ImageCropArea,
  size: { width: number; height: number },
  rotation = 0,
) => {
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像の加工に対応していません");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const radians = (rotation * Math.PI) / 180;
  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  const rotatedWidth =
    Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height);
  const rotatedHeight =
    Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height);
  // Cropper が返す回転後の座標で、出力サイズの Canvas に直接描画する。
  context.save();
  context.scale(size.width / area.width, size.height / area.height);
  context.translate(-area.x, -area.y);
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(radians);
  context.drawImage(image, -width / 2, -height / 2);
  context.restore();
};

type CreateEditedImageParams = {
  image: HTMLImageElement;
  area: ImageCropArea;
  size: { width: number; height: number };
  fileName: string;
  rotation?: number;
};

export const createEditedImage = async ({
  image,
  area,
  size,
  fileName,
  rotation = 0,
}: CreateEditedImageParams): Promise<File> => {
  const canvas = document.createElement("canvas");
  drawImageCrop(canvas, image, area, size, rotation);
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
