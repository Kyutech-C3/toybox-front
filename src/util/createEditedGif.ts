import type { GifProcessingResponse } from "./gifProcessingTypes";
import type { ImageCropArea } from "./imageProcessing";

type CreateEditedGifParams = {
  file: File;
  area: ImageCropArea;
  size: { width: number; height: number };
  rotation: number;
  signal: AbortSignal;
};

export const isGifFile = (file: File) =>
  file.type === "image/gif" || /\.gif$/i.test(file.name);

export const createEditedGif = async ({
  file,
  area,
  size,
  rotation,
  signal,
}: CreateEditedGifParams): Promise<File> => {
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./gifProcessingWorker.ts", import.meta.url),
      { type: "module" },
    );
    const cleanup = () => {
      worker.terminate();
      signal.removeEventListener("abort", handleAbort);
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("GIF processing cancelled", "AbortError"));
    };
    const handleError = () => {
      cleanup();
      reject(new Error("GIFを加工できませんでした"));
    };
    worker.onmessage = ({ data }: MessageEvent<GifProcessingResponse>) => {
      if (data.type === "error") {
        handleError();
        return;
      }
      cleanup();
      resolve(
        new File([data.buffer], `${file.name.replace(/\.[^.]+$/, "")}.gif`, {
          type: "image/gif",
        }),
      );
    };
    worker.onerror = handleError;
    worker.onmessageerror = handleError;
    signal.addEventListener("abort", handleAbort, { once: true });
    try {
      worker.postMessage({ buffer, area, size, rotation }, [buffer]);
    } catch {
      handleError();
    }
  });
};
