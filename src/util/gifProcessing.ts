import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrame, parseGIF } from "gifuct-js";

import { drawImageCrop } from "./imageProcessing";

import type { ParsedGif } from "gifuct-js";
import type { GifProcessingRequest } from "./gifProcessingTypes";

type GifFrame = Extract<ParsedGif["frames"][number], { image: unknown }>;

const getRepeatCount = (gif: ParsedGif) => {
  for (const frame of gif.frames) {
    if (!("application" in frame)) continue;
    const { id, blocks } = frame.application;
    if (
      (id === "NETSCAPE2.0" || id === "ANIMEXTS1.0") &&
      blocks.length >= 3 &&
      blocks[0] === 1
    )
      return blocks[1] | (blocks[2] << 8);
  }
  // ループ拡張のないGIFは1回だけ再生する。
  return -1;
};

export const processGif = ({
  buffer,
  area,
  size,
  rotation,
}: GifProcessingRequest): ArrayBuffer => {
  const gif = parseGIF(buffer);
  const frames = gif.frames.filter(
    (frame): frame is GifFrame => "image" in frame,
  );
  if (gif.header.signature !== "GIF" || frames.length === 0)
    throw new Error("Invalid GIF");

  const source = new OffscreenCanvas(gif.lsd.width, gif.lsd.height);
  const context = source.getContext("2d", { willReadFrequently: true });
  const patch = new OffscreenCanvas(1, 1);
  const patchContext = patch.getContext("2d");
  const output = new OffscreenCanvas(size.width, size.height);
  const outputContext = output.getContext("2d", { willReadFrequently: true });
  if (!context || !patchContext || !outputContext)
    throw new Error("Canvas unavailable");

  const backgroundColor = gif.gct?.[gif.lsd.backgroundColorIndex];
  const clearArea = (frame: GifFrame | null) => {
    const rectangle = frame?.image.descriptor ?? {
      left: 0,
      top: 0,
      width: source.width,
      height: source.height,
    };
    context.clearRect(
      rectangle.left,
      rectangle.top,
      rectangle.width,
      rectangle.height,
    );
    if (
      backgroundColor &&
      !(frame ?? frames[0]).gce?.extras.transparentColorGiven
    ) {
      context.fillStyle = `rgb(${backgroundColor.join(" ")})`;
      context.fillRect(
        rectangle.left,
        rectangle.top,
        rectangle.width,
        rectangle.height,
      );
    }
  };
  // 透過のないGIFでは、前フレームと同じ画素を透過にして差分だけ記録する。
  // 透過GIFは各フレームの背景をクリアし、消える画素も再現する。
  const canUseDeltaFrames =
    !!backgroundColor &&
    rotation % 90 === 0 &&
    !frames.some((frame) => frame.gce?.extras.transparentColorGiven);
  const previousPixels = canUseDeltaFrames
    ? new Uint8Array(size.width * size.height)
    : null;
  const renderFrames = (
    visit: (
      data: Uint8ClampedArray,
      frame: GifFrame,
      frameIndex: number,
    ) => void,
  ) => {
    clearArea(null);
    let previousFrame: GifFrame | null = null;
    let restoredArea: ImageData | null = null;
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
      const frame = frames[frameIndex];
      if (previousFrame?.gce?.extras.disposal === 2) clearArea(previousFrame);
      if (previousFrame?.gce?.extras.disposal === 3 && restoredArea) {
        const { left, top } = previousFrame.image.descriptor;
        context.putImageData(restoredArea, left, top);
      }
      const { left, top, width, height } = frame.image.descriptor;
      restoredArea =
        frame.gce?.extras.disposal === 3
          ? context.getImageData(left, top, width, height)
          : null;
      const decoded = decompressFrame(frame, gif.gct, true);
      patch.width = width;
      patch.height = height;
      patchContext.putImageData(
        new ImageData(new Uint8ClampedArray(decoded.patch), width, height),
        0,
        0,
      );
      context.drawImage(patch, left, top);
      drawImageCrop(output, source, area, size, rotation);
      visit(
        outputContext.getImageData(0, 0, size.width, size.height).data,
        frame,
        frameIndex,
      );
      previousFrame = frame;
    }
  };

  // 全フレームから色をサンプリングし、パレットの揺れと不要な差分を防ぐ。
  // フレーム画像を保持せず、サンプルのメモリは約1MBを上限にする。
  const pixelsPerFrame = size.width * size.height;
  const sampleCount = Math.min(
    pixelsPerFrame,
    Math.max(1, Math.floor(262144 / frames.length)),
  );
  const samples = new Uint8ClampedArray(sampleCount * frames.length * 4);
  renderFrames((data, _frame, frameIndex) => {
    for (let index = 0; index < sampleCount; index += 1) {
      const sourceOffset =
        Math.floor(((index + 0.5) * pixelsPerFrame) / sampleCount) * 4;
      const targetOffset = (frameIndex * sampleCount + index) * 4;
      samples.set(data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
    }
  });
  const palette = quantize(samples, 255);
  const transparentIndex = palette.length;
  const outputPalette = [...palette, [0, 0, 0] as [number, number, number]];
  const repeat = getRepeatCount(gif);
  const encoder = GIFEncoder();
  renderFrames((data, frame, frameIndex) => {
    const pixels = applyPalette(data, palette);
    for (let index = 0; index < pixels.length; index += 1) {
      const colorIndex = pixels[index];
      const isUnchanged =
        previousPixels &&
        frameIndex > 0 &&
        colorIndex === previousPixels[index];
      if (data[index * 4 + 3] < 128 || isUnchanged)
        pixels[index] = transparentIndex;
      if (previousPixels) previousPixels[index] = colorIndex;
    }
    encoder.writeFrame(pixels, size.width, size.height, {
      palette: outputPalette,
      transparent: true,
      transparentIndex,
      delay: (frame.gce?.delay ?? 0) * 10,
      repeat,
      dispose: canUseDeltaFrames ? 1 : 2,
    });
  });
  encoder.finish();
  return encoder.bytes().buffer;
};
