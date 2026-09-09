import { useRef, useState } from "react";

import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadPrompt from "../UploadPrompt";
import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

import type { ChangeEvent, DragEvent } from "react";

const ImageUpload = () => {
  const {
    thumbnail,
    validationError,
    handleSelectFile,
    handleRetry,
    handleRemove,
  } = useThumbnailUpload();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = thumbnail?.status === "uploading";

  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) handleSelectFile(files[0]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) handleSelectFile(files[0]);
    event.target.value = "";
  };

  return (
    <div className={styles["upload-container"]}>
      <h3 className={styles["upload-heading"]}>サムネイル</h3>
      <div
        className={styles["upload-frame"]}
        data-status={thumbnail?.status ?? "empty"}
        data-has-image={thumbnail?.previewURL ? "true" : "false"}
      >
        <button
          type="button"
          className={styles["upload-area"]}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-dragging={isDragging ? "true" : "false"}
          disabled={isUploading}
          aria-label="サムネイル画像をアップロード"
        >
          {thumbnail?.previewURL ? (
            <img
              src={thumbnail.previewURL}
              alt="サムネイル画像のプレビュー"
              className={styles["preview-image"]}
            />
          ) : (
            <UploadPrompt />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={THUMBNAIL_ACCEPT}
          onChange={handleInputChange}
          className={styles["file-input"]}
          tabIndex={-1}
        />
        {thumbnail && (
          <>
            <div className={styles["overlay-actions"]}>
              {thumbnail.status === "error" && (
                <UploadRetryButton
                  className={styles["overlay-button"]}
                  onClick={handleRetry}
                  isDisabled={false}
                  ariaLabel={`${thumbnail.fileName}を再アップロード`}
                />
              )}
              <UploadRemoveButton
                className={styles["overlay-button"]}
                onClick={handleRemove}
                isDisabled={isUploading}
                ariaLabel={`${thumbnail.fileName}を削除`}
              />
            </div>
            <div className={styles["upload-meta"]}>
              <span className={styles["file-name"]} title={thumbnail.fileName}>
                {thumbnail.fileName}
              </span>
              <span className={styles["status"]} aria-live="polite">
                {thumbnail.status === "uploading" && "アップロード中"}
                {thumbnail.status === "success" &&
                  thumbnail.file &&
                  "アップロード完了"}
                {thumbnail.status === "error" && "アップロードに失敗"}
              </span>
            </div>
          </>
        )}
      </div>
      {(validationError || thumbnail?.errorMessage) && (
        <p className={styles["error-message"]} role="alert">
          {validationError || thumbnail?.errorMessage}
        </p>
      )}
      <p className={styles["format-help"]}>
        PNG・JPG・JPEG・BMP・GIF・WEBP / 5MB以下
      </p>
    </div>
  );
};

export default ImageUpload;
