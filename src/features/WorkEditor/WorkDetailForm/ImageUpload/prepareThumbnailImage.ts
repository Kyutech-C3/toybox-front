import { createEditedImage, getImageOutputSize } from "@/util/imageProcessing";

const THUMBNAIL_ASPECT = 4 / 3;
const THUMBNAIL_LONG_SIDE = 1600;

export const prepareThumbnailImage = async (file: File): Promise<File> => {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = Math.min(
      image.naturalWidth,
      image.naturalHeight * THUMBNAIL_ASPECT,
    );
    const height = width / THUMBNAIL_ASPECT;
    const area = {
      x: (image.naturalWidth - width) / 2,
      y: (image.naturalHeight - height) / 2,
      width,
      height,
    };
    return await createEditedImage({
      image,
      area,
      size: getImageOutputSize({
        area,
        longSide: THUMBNAIL_LONG_SIDE,
        canUpscale: false,
      }),
      fileName: file.name,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};
