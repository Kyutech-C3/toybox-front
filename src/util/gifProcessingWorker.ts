import { processGif } from "./gifProcessing";

import type {
  GifProcessingRequest,
  GifProcessingResponse,
} from "./gifProcessingTypes";

self.onmessage = ({ data }: MessageEvent<GifProcessingRequest>) => {
  try {
    const buffer = processGif(data);
    const response: GifProcessingResponse = { type: "success", buffer };
    self.postMessage(response, { transfer: [buffer] });
  } catch {
    const response: GifProcessingResponse = { type: "error" };
    self.postMessage(response);
  }
};
