import { GIFEncoder } from "gifenc";

import type { GifPalette } from "gifenc";

export const createGifFixture = (hasDisposalFrames = false) => {
  const width = 160;
  const height = 120;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const tokens = getComputedStyle(document.documentElement);
  const palette: GifPalette = [];
  for (const token of ["--primary-color", "--font-color"]) {
    context.fillStyle = tokens.getPropertyValue(token);
    context.fillRect(0, 0, 1, 1);
    const color = context.getImageData(0, 0, 1, 1).data;
    palette.push([color[0], color[1], color[2]]);
  }
  palette.push([0, 0, 0]);
  const encoder = GIFEncoder();
  const delays = hasDisposalFrames ? [70, 130, 90, 0] : [70, 130, 0];
  delays.forEach((delay, frameIndex) => {
    const frameWidth =
      hasDisposalFrames && frameIndex > 0 ? width / 2 ** frameIndex : width;
    const frameHeight =
      hasDisposalFrames && frameIndex > 0 ? height / 2 ** frameIndex : height;
    const pixels = new Uint8Array(frameWidth * frameHeight);
    for (let index = 0; index < pixels.length; index += 1) {
      pixels[index] = hasDisposalFrames
        ? frameIndex === 1 || frameIndex === 2
          ? 1
          : 0
        : (index % width < width / 2 ? 0 : 1) ^ (frameIndex % 2);
    }
    encoder.writeFrame(pixels, frameWidth, frameHeight, {
      palette,
      delay,
      repeat: 2,
      dispose: hasDisposalFrames ? [1, 3, 2, 2][frameIndex] : 1,
      transparent: hasDisposalFrames,
      transparentIndex: 2,
    });
  });
  encoder.finish();
  return {
    file: new File([encoder.bytes()], "animation.gif", { type: "image/gif" }),
    palette,
  };
};
