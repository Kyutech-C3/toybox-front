import { useEffect, useRef, useState } from "react";

import useToast from "@/shared/ui/Toast/hook/useToast";
import { createEditedGif, isGifFile } from "@/util/createEditedGif";
import { createEditedImage } from "@/util/imageProcessing";

import type { ImageCropArea } from "@/util/imageProcessing";
import type { ImageEditState } from "../types";

export type ImageSaveFormat = "still" | "gif";

type UseImageProcessingParams = {
  file: File;
  onConfirm: (file: File, edit: ImageEditState) => void;
  onClose: () => void;
};

type ConfirmImageParams = {
  area: ImageCropArea | null;
  percentages: ImageCropArea | null;
  outputSize: { width: number; height: number } | null;
  rotation: number;
  format?: ImageSaveFormat;
};

type UseImageProcessingReturn = {
  sourceURL: string;
  image: HTMLImageElement | null;
  processingFormat: ImageSaveFormat | null;
  isProcessing: boolean;
  hasGifSource: boolean;
  handleConfirm: (params: ConfirmImageParams) => Promise<void>;
};

const useImageProcessing = ({
  file,
  onConfirm,
  onClose,
}: UseImageProcessingParams): UseImageProcessingReturn => {
  const isMountedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const processingControllerRef = useRef<AbortController | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { showToast } = useToast();
  const [sourceURL, setSourceURL] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processingFormat, setProcessingFormat] =
    useState<ImageSaveFormat | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      processingControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const sourceImage = new Image();
    let isActive = true;
    setImage(null);
    setProcessingFormat(null);
    isProcessingRef.current = false;
    processingControllerRef.current = null;
    setSourceURL(url);
    sourceImage.onload = () => {
      if (isActive) setImage(sourceImage);
    };
    sourceImage.onerror = () => {
      if (!isActive) return;
      onCloseRef.current();
      showToast({ message: "画像を読み込めませんでした", severity: "error" });
    };
    // StrictMode の setup → cleanup → setup 後に、有効な読込だけを開始する。
    queueMicrotask(() => {
      if (isActive) sourceImage.src = url;
    });
    return () => {
      isActive = false;
      processingControllerRef.current?.abort();
      sourceImage.onload = null;
      sourceImage.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file, showToast]);

  const handleConfirm = async ({
    area,
    percentages,
    outputSize,
    rotation,
    format = "still",
  }: ConfirmImageParams) => {
    if (
      !image ||
      !area ||
      !percentages ||
      !outputSize ||
      isProcessingRef.current
    )
      return;
    isProcessingRef.current = true;
    const controller = new AbortController();
    processingControllerRef.current = controller;
    setProcessingFormat(format);
    try {
      const editedFile =
        format === "gif"
          ? await createEditedGif({
              file,
              area,
              size: outputSize,
              rotation,
              signal: controller.signal,
            })
          : await createEditedImage({
              image,
              area,
              size: outputSize,
              fileName: file.name,
              rotation,
            });
      if (isMountedRef.current && !controller.signal.aborted)
        onConfirm(editedFile, {
          croppedAreaPercentages: percentages,
          rotation,
        });
    } catch {
      if (isMountedRef.current && !controller.signal.aborted) {
        showToast({
          message:
            format === "gif"
              ? "GIFを加工できませんでした"
              : "画像を加工できませんでした",
          severity: "error",
        });
        if (format === "still") onCloseRef.current();
      }
    } finally {
      if (processingControllerRef.current === controller) {
        isProcessingRef.current = false;
        processingControllerRef.current = null;
        if (isMountedRef.current) setProcessingFormat(null);
      }
    }
  };

  return {
    sourceURL,
    image,
    processingFormat,
    isProcessing: processingFormat !== null,
    hasGifSource: isGifFile(file),
    handleConfirm,
  };
};

export default useImageProcessing;
