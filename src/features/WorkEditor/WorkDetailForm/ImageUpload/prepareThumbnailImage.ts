import {
  createEditedImage,
  getImageOutputSize,
  IMAGE_EDIT_SETTINGS,
} from "@/util/imageProcessing";

export const prepareThumbnailImage = async (file: File): Promise<File> => {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = Math.min(
      image.naturalWidth,
      image.naturalHeight * IMAGE_EDIT_SETTINGS.thumbnail.aspect,
    );
    const height = width / IMAGE_EDIT_SETTINGS.thumbnail.aspect;
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
        longSide: IMAGE_EDIT_SETTINGS.thumbnail.longSide,
        canUpscale: false,
      }),
      fileName: file.name,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};
