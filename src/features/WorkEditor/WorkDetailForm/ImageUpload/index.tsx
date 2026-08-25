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
      <span className={styles["upload-label"]}>サムネイル</span>
      <div className={styles["upload-frame"]}>
        <button
          type="button"
          className={styles["upload-area"]}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-dragging={isDragging ? "true" : "false"}
          data-has-image={thumbnail?.previewURL ? "true" : "false"}
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
          <UploadRemoveButton
            className={styles["remove-button"]}
            onClick={handleRemove}
            isDisabled={isUploading}
            ariaLabel={`${thumbnail.fileName}を削除`}
          />
        )}
      </div>
      <div className={styles["upload-meta"]} aria-live="polite">
        {thumbnail && (
          <span className={styles["file-name"]}>{thumbnail.fileName}</span>
        )}
        {thumbnail?.status === "uploading" && <span>アップロード中</span>}
        {thumbnail?.status === "success" && thumbnail.file && (
          <span>アップロード完了</span>
        )}
        {thumbnail?.status === "error" && (
          <UploadRetryButton onClick={handleRetry} />
        )}
      </div>
      {(validationError || thumbnail?.errorMessage) && (
        <p className={styles["error-message"]} role="alert">
          {validationError || thumbnail?.errorMessage}
        </p>
      )}
      <p className={styles["format-help"]}>
        PNG・JPG・JPEG・BMP・GIF / 5MB以下
      </p>
    </div>
  );
};

export default ImageUpload;
