import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import RotateLeftRoundedIcon from "@mui/icons-material/RotateLeftRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import useToast from "@/shared/ui/Toast/hook/useToast";
import {
  createEditedImage,
  drawImageCrop,
  getImageOutputSize,
  IMAGE_EDIT_SETTINGS,
} from "@/util/imageProcessing";

import type { KeyboardEvent } from "react";
import type { MediaSize, Size } from "react-easy-crop";
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

const ImageEditorDialog = ({
  file,
  purpose,
  initialEdit,
  onConfirm,
  onClose,
}: ImageEditorDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const mediaSizeRef = useRef<MediaSize | null>(null);
  const cropSizeRef = useRef<Size | null>(null);
  const titleID = useId();
  const hintID = useId();
  const zoomID = useId();
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
    if (!image || !area) return;
    const frame = requestAnimationFrame(() => {
      if (previewRef.current)
        drawImageCrop(
          previewRef.current,
          image,
          area,
          { width: 120, height: Math.round(120 / settings.aspect) },
          rotation,
        );
    });
    return () => cancelAnimationFrame(frame);
  }, [image, area, rotation, settings.aspect]);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), summary, [tabindex='0']",
      ),
    ).filter(
      (control) =>
        !control.closest("[inert]") &&
        (control.tagName === "SUMMARY" ||
          !control.closest("details:not([open])")) &&
        control.getClientRects().length > 0,
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

  const handleConfirm = async () => {
    if (
      !image ||
      !area ||
      !percentages ||
      !outputSize ||
      isProcessingRef.current
    )
      return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const editedFile = await createEditedImage({
        image,
        area,
        size: outputSize,
        fileName: file.name,
        rotation,
      });
      if (isMountedRef.current)
        onConfirm(editedFile, {
          croppedAreaPercentages: percentages,
          rotation,
        });
    } catch {
      if (isMountedRef.current) {
        showToast({
          message: "画像を加工できませんでした",
          severity: "error",
        });
        onCloseRef.current();
      }
    } finally {
      isProcessingRef.current = false;
      if (isMountedRef.current) setIsProcessing(false);
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
    setZoom((value) => Math.min(3, Math.max(1, value + change)));
  };

  const handleMove = (x: number, y: number) => {
    const mediaSize = mediaSizeRef.current;
    const cropSize = cropSizeRef.current;
    if (!mediaSize || !cropSize) return;
    const isQuarterTurn = rotation % 180 !== 0;
    const width = isQuarterTurn ? mediaSize.height : mediaSize.width;
    const height = isQuarterTurn ? mediaSize.width : mediaSize.height;
    const maxX = Math.max(0, (width * zoom - cropSize.width) / 2);
    const maxY = Math.max(0, (height * zoom - cropSize.height) / 2);
    setCrop((position) => ({
      x: Math.min(maxX, Math.max(-maxX, position.x + x)),
      y: Math.min(maxY, Math.max(-maxY, position.y + y)),
    }));
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      className={styles["dialog"]}
      aria-labelledby={titleID}
      aria-describedby={hintID}
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
        <p id={hintID}>
          <span className={styles["pointer-hint"]}>
            写真をドラッグして位置を調整できます
          </span>
          <span className={styles["touch-hint"]}>
            指で写真を移動・ピンチで拡大できます
          </span>
        </p>
      </header>
      <div className={styles["workspace"]}>
        <div className={styles["crop-container"]} inert={isProcessing}>
          {image ? (
            <Cropper
              key={cropVersion}
              image={sourceURL}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={settings.aspect}
              cropShape={settings.cropShape}
              initialCroppedAreaPercentages={initialCrop}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              setMediaSize={(size) => {
                mediaSizeRef.current = size;
              }}
              onCropSizeChange={(size) => {
                cropSizeRef.current = size;
              }}
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
        <aside className={styles["preview"]} aria-label="完成プレビュー">
          <span>完成プレビュー</span>
          <canvas
            ref={previewRef}
            className={styles["preview-image"]}
            data-round={purpose === "avatar" || undefined}
            data-ready={!!outputSize}
            role="img"
            aria-label="切り抜き後の画像"
          />
          <output className={styles["output-size"]} aria-label="出力サイズ">
            {outputSize
              ? `${outputSize.width} × ${outputSize.height}px`
              : "読込中"}
          </output>
        </aside>
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
            max="3"
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
            disabled={!image || isProcessing || zoom >= 3}
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
        <details className={styles["fine-adjustment"]}>
          <summary>位置を細かく調整</summary>
          <div className={styles["move-controls"]}>
            <Button
              variant="secondary"
              isIconOnly
              icon={<ArrowBackRoundedIcon />}
              ariaLabel="写真を左へ移動"
              disabled={!image || isProcessing}
              onClick={() => handleMove(-10, 0)}
            />
            <Button
              variant="secondary"
              isIconOnly
              icon={<ArrowUpwardRoundedIcon />}
              ariaLabel="写真を上へ移動"
              disabled={!image || isProcessing}
              onClick={() => handleMove(0, -10)}
            />
            <Button
              variant="secondary"
              isIconOnly
              icon={<ArrowDownwardRoundedIcon />}
              ariaLabel="写真を下へ移動"
              disabled={!image || isProcessing}
              onClick={() => handleMove(0, 10)}
            />
            <Button
              variant="secondary"
              isIconOnly
              icon={<ArrowForwardRoundedIcon />}
              ariaLabel="写真を右へ移動"
              disabled={!image || isProcessing}
              onClick={() => handleMove(10, 0)}
            />
          </div>
        </details>
      </div>
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
