import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import RotateLeftRoundedIcon from "@mui/icons-material/RotateLeftRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";

import useImageCrop, { MAX_ZOOM } from "./hook/useImageCrop";
import useImageProcessing from "./hook/useImageProcessing";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Dialog from "@/shared/ui/Dialog";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";

import type { ImageSaveFormat } from "./hook/useImageProcessing";
import type { ImageEditSettings, ImageEditState } from "./types";

export type { ImageEditSettings, ImageEditState } from "./types";

type ImageEditorDialogProps = {
  file: File;
  title?: string;
  settings: ImageEditSettings;
  initialEdit?: ImageEditState;
  isDismissible?: boolean;
  onConfirm: (file: File, edit: ImageEditState) => void;
  onClose: () => void;
};

const ImageEditorDialog = ({
  file,
  title = "画像を編集",
  settings,
  initialEdit,
  isDismissible = true,
  onConfirm,
  onClose,
}: ImageEditorDialogProps) => {
  const titleID = useId();
  const zoomID = useId();
  const rotationID = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const {
    sourceURL,
    image,
    processingFormat,
    isProcessing,
    hasGifSource,
    handleConfirm: handleProcessImage,
  } = useImageProcessing({ file, onConfirm, onClose });
  const {
    cropContainerRef,
    cropSize,
    crop,
    zoom,
    rotation,
    initialCrop,
    cropVersion,
    area,
    percentages,
    outputSize,
    setZoom,
    setMediaSize,
    handleCropAreaChange,
    handleReset,
    handleZoom,
    handleCropChange,
    handleRotation,
  } = useImageCrop({ image, settings, initialEdit });
  const hasCropper = image !== null && cropSize !== null;

  useEffect(() => {
    if (hasCropper)
      cropContainerRef.current
        ?.querySelector<HTMLElement>("[role='group']")
        ?.focus({ preventScroll: true });
  }, [hasCropper, cropContainerRef]);

  useEffect(() => {
    if (isProcessing) cancelButtonRef.current?.focus({ preventScroll: true });
  }, [isProcessing]);

  const handleConfirm = (format: ImageSaveFormat = "still") =>
    handleProcessImage({ area, percentages, outputSize, rotation, format });

  return createPortal(
    <Dialog
      isOpen
      isDismissible={isDismissible}
      onClose={onClose}
      isInitialFocusOnDialog
      tabIndex={-1}
      className={styles["dialog"]}
      aria-labelledby={titleID}
    >
      <header className={styles["header"]}>
        <h2 id={titleID}>{title}</h2>
        <output className={styles["output-size"]} aria-label="出力サイズ">
          {outputSize
            ? `${outputSize.width} × ${outputSize.height}px`
            : "読込中"}
        </output>
      </header>
      <div className={styles["workspace"]}>
        <div
          ref={cropContainerRef}
          className={styles["crop-container"]}
          inert={isProcessing}
        >
          {image && cropSize ? (
            <Cropper
              key={cropVersion}
              image={sourceURL}
              crop={crop}
              zoom={zoom}
              maxZoom={MAX_ZOOM}
              rotation={rotation}
              aspect={settings.aspect}
              cropSize={cropSize}
              cropShape={settings.cropShape}
              initialCroppedAreaPercentages={initialCrop}
              restrictPosition={false}
              onCropChange={handleCropChange}
              setMediaSize={setMediaSize}
              onZoomChange={setZoom}
              onCropAreaChange={handleCropAreaChange}
              cropperProps={{
                role: "group",
                "aria-label": "画像の切り抜き位置",
              }}
              classes={{
                containerClassName: styles["crop-surface"],
                cropAreaClassName: styles["crop-frame"],
              }}
            />
          ) : (
            <LoadingSpinner />
          )}
          {image && cropSize && (
            <div
              className={styles["output-frame"]}
              style={{ width: cropSize.width, height: cropSize.height }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <div className={styles["controls"]}>
        <div className={styles["slider-label"]}>
          <label htmlFor={zoomID}>ズーム</label>
          <output htmlFor={zoomID}>{Math.round(zoom * 100)}%</output>
        </div>
        <div className={styles["slider-controls"]}>
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
            className={styles["slider"]}
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
        <div className={styles["slider-label"]}>
          <label htmlFor={rotationID}>回転</label>
          <output htmlFor={rotationID}>{rotation}°</output>
        </div>
        <div className={styles["slider-controls"]}>
          <Button
            variant="secondary"
            isIconOnly
            icon={<RotateLeftRoundedIcon />}
            ariaLabel="左に1度回転"
            disabled={!image || isProcessing || rotation <= -180}
            onClick={() => handleRotation(rotation - 1)}
          />
          <input
            id={rotationID}
            className={styles["slider"]}
            aria-label="回転"
            aria-valuetext={`${rotation}度`}
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation}
            disabled={!image || isProcessing}
            onChange={(event) => handleRotation(Number(event.target.value))}
          />
          <Button
            variant="secondary"
            isIconOnly
            icon={<RotateRightRoundedIcon />}
            ariaLabel="右に1度回転"
            disabled={!image || isProcessing || rotation >= 180}
            onClick={() => handleRotation(rotation + 1)}
          />
        </div>
      </div>
      <div className={styles["actions"]} data-gif={hasGifSource || undefined}>
        <Button
          variant="ghost"
          className={styles["reset-button"]}
          icon={<RestartAltRoundedIcon />}
          disabled={!image || isProcessing}
          onClick={handleReset}
        >
          リセット
        </Button>
        <Button ref={cancelButtonRef} variant="secondary" onClick={onClose}>
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
    </Dialog>,
    document.body,
  );
};

export default ImageEditorDialog;
