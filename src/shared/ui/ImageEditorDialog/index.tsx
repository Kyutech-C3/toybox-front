import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import RotateLeftRoundedIcon from "@mui/icons-material/RotateLeftRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { createEditedGif, isGifFile } from "@/util/createEditedGif";
import {
  createEditedImage,
  getImageOutputSize,
  IMAGE_EDIT_SETTINGS,
} from "@/util/imageProcessing";

import type { KeyboardEvent } from "react";
import type { ImageCropArea } from "@/util/imageProcessing";

export type ImageEditState = {
  croppedAreaPercentages: ImageCropArea;
  rotation?: number;
};

type ImageEditorDialogProps = {
  file: File;
  purpose: "avatar" | "thumbnail";
  initialEdit?: ImageEditState;
  onConfirm: (file: File, edit: ImageEditState) => void;
  onClose: () => void;
};

const MAX_ZOOM = 10;
type ImageSaveFormat = "still" | "gif";

const ImageEditorDialog = ({
  file,
  purpose,
  initialEdit,
  onConfirm,
  onClose,
}: ImageEditorDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  const zoomID = useId();
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
  const isProcessing = processingFormat !== null;
  const hasGifSource = isGifFile(file);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(initialEdit?.rotation ?? 0);
  const [initialCrop, setInitialCrop] = useState(
    initialEdit?.croppedAreaPercentages,
  );
  const [cropVersion, setCropVersion] = useState(0);
  const [area, setArea] = useState<ImageCropArea | null>(null);
  const [percentages, setPercentages] = useState<ImageCropArea | null>(null);
  const settings = IMAGE_EDIT_SETTINGS[purpose];
  const outputSize = area
    ? getImageOutputSize({
        area,
        longSide: settings.longSide,
        canUpscale: false,
      })
    : null;

  useEffect(() => {
    isMountedRef.current = true;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      isMountedRef.current = false;
      processingControllerRef.current?.abort();
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const sourceImage = new Image();
    let isActive = true;
    setImage(null);
    setArea(null);
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

  useEffect(() => {
    if (image)
      dialogRef.current
        ?.querySelector<HTMLElement>("[role='group']")
        ?.focus({ preventScroll: true });
  }, [image]);

  useEffect(() => {
    if (isProcessing)
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus({ preventScroll: true });
  }, [isProcessing]);

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
    ).filter(
      (control) =>
        !control.closest("[inert]") && control.getClientRects().length > 0,
    );
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

  const handleConfirm = async (format: ImageSaveFormat = "still") => {
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

  const handleReset = (nextRotation = 0) => {
    setInitialCrop(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(nextRotation);
    setArea(null);
    setPercentages(null);
    setCropVersion((version) => version + 1);
  };

  const handleZoom = (change: number) => {
    setZoom((value) => Math.min(MAX_ZOOM, Math.max(1, value + change)));
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      className={styles["dialog"]}
      aria-labelledby={titleID}
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles["header"]}>
        <h2 id={titleID}>
          {purpose === "avatar" ? "アイコン画像を編集" : "サムネイル画像を編集"}
        </h2>
        <output className={styles["output-size"]} aria-label="出力サイズ">
          {outputSize
            ? `${outputSize.width} × ${outputSize.height}px`
            : "読込中"}
        </output>
      </header>
      <div className={styles["workspace"]}>
        <div className={styles["crop-container"]} inert={isProcessing}>
          {image ? (
            <Cropper
              key={cropVersion}
              image={sourceURL}
              crop={crop}
              zoom={zoom}
              maxZoom={MAX_ZOOM}
              rotation={rotation}
              aspect={settings.aspect}
              cropShape={settings.cropShape}
              initialCroppedAreaPercentages={initialCrop}
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
      </div>
      <div className={styles["controls"]}>
        <div className={styles["zoom-label"]}>
          <label htmlFor={zoomID}>ズーム</label>
          <output htmlFor={zoomID}>{Math.round(zoom * 100)}%</output>
        </div>
        <div className={styles["zoom-controls"]}>
          <Button
            variant="secondary"
            isIconOnly
            icon={<RemoveRoundedIcon />}
            ariaLabel="ズームを縮小"
            disabled={!image || isProcessing || zoom <= 1}
            onClick={() => handleZoom(-0.1)}
          />
          <input
            id={zoomID}
            className={styles["zoom"]}
            aria-label="ズーム"
            type="range"
            min="1"
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            disabled={!image || isProcessing}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <Button
            variant="secondary"
            isIconOnly
            icon={<AddRoundedIcon />}
            ariaLabel="ズームを拡大"
            disabled={!image || isProcessing || zoom >= MAX_ZOOM}
            onClick={() => handleZoom(0.1)}
          />
        </div>
        <div className={styles["tools"]}>
          <Button
            variant="secondary"
            icon={<RotateLeftRoundedIcon />}
            ariaLabel="左に90度回転"
            disabled={!image || isProcessing}
            onClick={() => handleReset((rotation + 270) % 360)}
          >
            左回転
          </Button>
          <Button
            variant="secondary"
            icon={<RotateRightRoundedIcon />}
            ariaLabel="右に90度回転"
            disabled={!image || isProcessing}
            onClick={() => handleReset((rotation + 90) % 360)}
          >
            右回転
          </Button>
          <Button
            variant="ghost"
            icon={<RestartAltRoundedIcon />}
            disabled={!image || isProcessing}
            onClick={() => handleReset()}
          >
            リセット
          </Button>
        </div>
      </div>
      <div className={styles["actions"]} data-gif={hasGifSource || undefined}>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          onClick={() => void handleConfirm()}
          isLoading={processingFormat === "still"}
          disabled={!image || !area || isProcessing}
        >
          {hasGifSource ? "静止画保存" : "保存"}
        </Button>
        {hasGifSource && (
          <Button
            onClick={() => void handleConfirm("gif")}
            isLoading={processingFormat === "gif"}
            disabled={!image || !area || isProcessing}
          >
            GIF保存
          </Button>
        )}
      </div>
    </dialog>,
    document.body,
  );
};

export default ImageEditorDialog;
