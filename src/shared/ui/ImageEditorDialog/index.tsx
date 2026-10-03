import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import FieldError from "@/shared/ui/FieldError";
import Input from "@/shared/ui/Input";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import {
  createEditedImage,
  drawImageCrop,
  getImageOutputSize,
  MAX_IMAGE_OUTPUT_SIDE,
} from "@/util/imageProcessing";

import type { KeyboardEvent } from "react";
import type { ImageCropArea } from "@/util/imageProcessing";

type ImageEditorDialogProps = {
  file: File;
  purpose: "avatar" | "thumbnail";
  onConfirm: (file: File) => void;
  onClose: () => void;
};

const RATIOS = [
  { value: "1:1", width: 1, height: 1 },
  { value: "4:3", width: 4, height: 3 },
  { value: "16:9", width: 16, height: 9 },
];

const ImageEditorDialog = ({
  file,
  purpose,
  onConfirm,
  onClose,
}: ImageEditorDialogProps) => {
  const titleID = useId();
  const helpID = useId();
  const zoomID = useId();
  const resolutionID = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const isMountedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const [sourceURL, setSourceURL] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<ImageCropArea | null>(null);
  const [ratio, setRatio] = useState(purpose === "avatar" ? "1:1" : "4:3");
  const [ratioWidth, setRatioWidth] = useState("4");
  const [ratioHeight, setRatioHeight] = useState("3");
  const [longSide, setLongSide] = useState(
    purpose === "avatar" ? "512" : "1600",
  );
  const [canUpscale, setCanUpscale] = useState(false);

  const preset = RATIOS.find((item) => item.value === ratio);
  const aspect = preset
    ? preset.width / preset.height
    : ratio === "original" && image
      ? image.naturalWidth / image.naturalHeight
      : Number(ratioWidth) / Number(ratioHeight);
  const hasValidRatio =
    Number.isFinite(aspect) &&
    aspect >= 0.05 &&
    aspect <= 20 &&
    (ratio !== "custom" || (Number(ratioWidth) > 0 && Number(ratioHeight) > 0));
  const hasValidResolution =
    Number.isInteger(Number(longSide)) &&
    Number(longSide) >= 1 &&
    Number(longSide) <= MAX_IMAGE_OUTPUT_SIDE;
  const outputSize =
    area && hasValidResolution
      ? getImageOutputSize({ area, longSide: Number(longSide), canUpscale })
      : null;
  const hasLowResolution =
    area !== null && Number(longSide) > Math.max(area.width, area.height);

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
    const url = URL.createObjectURL(file);
    const sourceImage = new Image();
    let isActive = true;
    setSourceURL(url);
    sourceImage.onload = () => {
      if (isActive) setImage(sourceImage);
    };
    sourceImage.onerror = () => {
      if (isActive)
        setError("画像を読み込めませんでした。別の画像を選択してください。");
    };
    sourceImage.src = url;
    return () => {
      isActive = false;
      sourceImage.onload = null;
      sourceImage.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !image || !area || !outputSize) return;
    const scale = Math.min(
      1,
      320 / Math.max(outputSize.width, outputSize.height),
    );
    drawImageCrop(canvas, image, area, {
      width: Math.max(1, Math.round(outputSize.width * scale)),
      height: Math.max(1, Math.round(outputSize.height * scale)),
    });
  }, [image, area, outputSize]);

  const handleRatioChange = (value: string) => {
    setRatio(value);
    setArea(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

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
    if (
      !image ||
      !area ||
      !outputSize ||
      !hasValidRatio ||
      isProcessingRef.current
    )
      return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setError("");
    try {
      const editedFile = await createEditedImage({
        image,
        area,
        size: outputSize,
        fileName: file.name,
      });
      if (isMountedRef.current) onConfirm(editedFile);
    } catch {
      if (isMountedRef.current)
        setError("画像を加工できませんでした。もう一度お試しください。");
    } finally {
      isProcessingRef.current = false;
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles["dialog"]}
      aria-labelledby={titleID}
      aria-describedby={helpID}
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles["header"]}>
        <h2 id={titleID}>
          {purpose === "avatar" ? "アイコン画像を編集" : "サムネイル画像を編集"}
        </h2>
        <Button variant="secondary" onClick={onClose}>
          閉じる
        </Button>
      </div>
      <div className={styles["body"]}>
        <p id={helpID} className={styles["help"]}>
          写真をドラッグ、または切り抜き枠にフォーカスして矢印キーで位置を調整できます。
        </p>
        <div className={styles["crop-container"]} inert={isProcessing}>
          {image && hasValidRatio ? (
            <Cropper
              key={`${ratio}-${ratioWidth}-${ratioHeight}`}
              image={sourceURL}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={
                purpose === "avatar" && ratio === "1:1" ? "round" : "rect"
              }
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={(_percentages, pixels) => setArea(pixels)}
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
          ) : !image && !error ? (
            <LoadingSpinner />
          ) : null}
        </div>
        <fieldset className={styles["controls"]} disabled={isProcessing}>
          <legend>画像の調整</legend>
          <label htmlFor={zoomID}>ズーム（{zoom.toFixed(1)}倍）</label>
          <input
            id={zoomID}
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <fieldset className={styles["ratios"]}>
            <legend>切り抜き比率</legend>
            {[
              ...RATIOS.map((item) => ({
                value: item.value,
                label: `${item.value}${item.value === "4:3" && purpose === "thumbnail" ? "（推奨）" : ""}`,
              })),
              { value: "original", label: "元画像" },
              { value: "custom", label: "指定" },
            ].map((item) => (
              <label key={item.value}>
                <input
                  type="radio"
                  name={`${titleID}-ratio`}
                  value={item.value}
                  checked={ratio === item.value}
                  onChange={() => handleRatioChange(item.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          {ratio === "custom" && (
            <div className={styles["custom-ratio"]}>
              <Input
                aria-label="比率の横"
                type="number"
                min="0"
                step="any"
                value={ratioWidth}
                onChange={(value) => {
                  setRatioWidth(value);
                  setArea(null);
                }}
              />
              <span>:</span>
              <Input
                aria-label="比率の縦"
                type="number"
                min="0"
                step="any"
                value={ratioHeight}
                onChange={(value) => {
                  setRatioHeight(value);
                  setArea(null);
                }}
              />
            </div>
          )}
          {!hasValidRatio && (
            <FieldError>
              比率は 1:20 から 20:1 の範囲で指定してください。
            </FieldError>
          )}
          <label htmlFor={resolutionID}>出力解像度（長辺 px）</label>
          <Input
            id={resolutionID}
            type="number"
            min="1"
            max={MAX_IMAGE_OUTPUT_SIDE}
            value={longSide}
            onChange={setLongSide}
            aria-invalid={!hasValidResolution}
          />
          <div className={styles["presets"]}>
            {[256, 512, 1024, 1600].map((value) => (
              <Button
                key={value}
                variant="secondary"
                size="small"
                isActive={Number(longSide) === value}
                onClick={() => setLongSide(String(value))}
              >
                {value}px
              </Button>
            ))}
          </div>
          {!hasValidResolution && (
            <FieldError>
              解像度は 1〜{MAX_IMAGE_OUTPUT_SIDE}px の整数で指定してください。
            </FieldError>
          )}
          <label className={styles["checkbox"]}>
            <input
              type="checkbox"
              checked={canUpscale}
              onChange={(event) => setCanUpscale(event.target.checked)}
            />
            元画像より大きい解像度への拡大を許可する
          </label>
        </fieldset>
        {image && (
          <p className={styles["help"]}>
            元画像: {image.naturalWidth} × {image.naturalHeight}px
          </p>
        )}
        {outputSize && (
          <div className={styles["preview-row"]}>
            <canvas
              ref={previewRef}
              className={styles["preview"]}
              data-purpose={purpose}
              role="img"
              aria-label={
                purpose === "avatar"
                  ? "円形アイコンの仕上がり"
                  : "4:3 のサムネイル表示プレビュー"
              }
            />
            <div>
              <p role="status">
                出力: {outputSize.width} × {outputSize.height}px
              </p>
              <p className={styles["help"]}>
                {purpose === "avatar"
                  ? "アイコンは中央を円形に表示します。"
                  : "一覧の標準表示は 4:3 です。スマホでは表示範囲が変わります。"}
              </p>
            </div>
          </div>
        )}
        {hasLowResolution && (
          <p className={styles["notice"]} role="status">
            {canUpscale
              ? "拡大しても写真の細部は鮮明になりません。"
              : "切り抜き範囲の解像度が指定値より低いため、拡大せずに出力します。"}
          </p>
        )}
        <p className={styles["help"]}>
          加工後は静止画像として保存します。GIF
          のアニメーションは保持されません。
        </p>
        {error && <FieldError role="alert">{error}</FieldError>}
      </div>
      <div className={styles["actions"]}>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          onClick={() => void handleConfirm()}
          isLoading={isProcessing}
          disabled={!image || !area || !hasValidRatio || !hasValidResolution}
        >
          適用
        </Button>
      </div>
    </dialog>,
    document.body,
  );
};

export default ImageEditorDialog;
