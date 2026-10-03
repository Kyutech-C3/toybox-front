import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import useToast from "@/shared/ui/Toast/hook/useToast";
import {
  createEditedImage,
  getImageOutputSize,
  IMAGE_EDIT_SETTINGS,
} from "@/util/imageProcessing";

import type { KeyboardEvent } from "react";
import type { ImageCropArea } from "@/util/imageProcessing";

export type ImageEditState = {
  croppedAreaPercentages: ImageCropArea;
};

export type ImageEditorSource =
  | { file: File; imageURL?: never; fileName?: never }
  | { file?: never; imageURL: string; fileName: string };

type ImageEditorDialogProps = ImageEditorSource & {
  purpose: "avatar" | "thumbnail";
  initialEdit?: ImageEditState;
  onConfirm: (file: File, edit: ImageEditState) => void;
  onClose: () => void;
};

const ImageEditorDialog = ({
  file,
  imageURL,
  fileName,
  purpose,
  initialEdit,
  onConfirm,
  onClose,
}: ImageEditorDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isMountedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { showToast } = useToast();
  const [sourceURL, setSourceURL] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<ImageCropArea | null>(null);
  const [percentages, setPercentages] = useState<ImageCropArea | null>(null);
  const settings = IMAGE_EDIT_SETTINGS[purpose];

  useEffect(() => {
    isMountedRef.current = true;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      isMountedRef.current = false;
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, []);

  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : imageURL;
    const sourceImage = new Image();
    let isActive = true;
    setImage(null);
    setArea(null);
    setSourceURL(url);
    sourceImage.onload = () => {
      if (isActive) setImage(sourceImage);
    };
    sourceImage.onerror = () => {
      if (!isActive) return;
      onCloseRef.current();
      showToast({ message: "画像を読み込めませんでした", severity: "error" });
    };
    sourceImage.src = url;
    return () => {
      isActive = false;
      sourceImage.onload = null;
      sourceImage.onerror = null;
      if (file) URL.revokeObjectURL(url);
    };
  }, [file, imageURL, showToast]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), [tabindex='0']",
      ),
    ).filter((control) => !control.closest("[inert]"));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const handleConfirm = async () => {
    if (!image || !area || !percentages || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      let canvasImage = image;
      const source = new URL(image.src, document.baseURI);
      const hasExternalSource =
        (source.protocol === "https:" || source.protocol === "http:") &&
        source.origin !== window.location.origin;
      if (hasExternalSource) {
        canvasImage = new Image();
        canvasImage.crossOrigin = "anonymous";
        canvasImage.src = image.src;
        await canvasImage.decode();
      }
      if (!isMountedRef.current) return;
      const editedFile = await createEditedImage({
        image: canvasImage,
        area,
        size: getImageOutputSize({
          area,
          longSide: settings.longSide,
          canUpscale: false,
        }),
        fileName: file ? file.name : fileName,
      });
      if (isMountedRef.current)
        onConfirm(editedFile, { croppedAreaPercentages: percentages });
    } catch {
      if (isMountedRef.current) {
        const source = new URL(image.src, document.baseURI);
        const hasExternalSource =
          (source.protocol === "https:" || source.protocol === "http:") &&
          source.origin !== window.location.origin;
        showToast({
          message: hasExternalSource
            ? "画像を保存できませんでした。画像配信元のCORS設定も確認してください。"
            : "画像を加工できませんでした",
          severity: "error",
        });
        onCloseRef.current();
      }
    } finally {
      isProcessingRef.current = false;
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles["dialog"]}
      aria-label="画像編集"
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles["crop-container"]} inert={isProcessing}>
        {image ? (
          <Cropper
            image={sourceURL}
            crop={crop}
            zoom={zoom}
            aspect={settings.aspect}
            cropShape={settings.cropShape}
            initialCroppedAreaPercentages={initialEdit?.croppedAreaPercentages}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropAreaChange={(croppedPercentages, pixels) => {
              setArea(pixels);
              setPercentages(croppedPercentages);
            }}
            cropperProps={{
              role: "group",
              "aria-label": "画像の切り抜き位置",
            }}
            classes={{
              containerClassName: styles["crop-surface"],
              cropAreaClassName: styles["crop-frame"],
            }}
            zoomWithScroll={false}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
      <input
        className={styles["zoom"]}
        aria-label="ズーム"
        type="range"
        min="1"
        max="3"
        step="0.01"
        value={zoom}
        disabled={!image || isProcessing}
        onChange={(event) => setZoom(Number(event.target.value))}
      />
      <div className={styles["actions"]}>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          onClick={() => void handleConfirm()}
          isLoading={isProcessing}
          disabled={!image || !area}
        >
          保存
        </Button>
      </div>
    </dialog>,
    document.body,
  );
};

export default ImageEditorDialog;
