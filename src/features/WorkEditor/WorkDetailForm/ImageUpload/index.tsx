import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadArea from "../UploadArea";
import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

const ImageUpload = () => {
  const {
    thumbnail,
    validationError,
    handleSelectFile,
    handleRetry,
    handleRemove,
  } = useThumbnailUpload();
  const isUploading = thumbnail?.status === "uploading";

  return (
    <div className={styles["upload-container"]}>
      <h3 className={styles["upload-heading"]}>サムネイル</h3>
      <div
        className={styles["upload-frame"]}
        data-status={thumbnail?.status ?? "empty"}
        data-has-image={thumbnail?.previewURL ? "true" : "false"}
      >
        <UploadArea
          accept={THUMBNAIL_ACCEPT}
          ariaLabel="サムネイル画像をアップロード"
          onSelectFiles={(files) => handleSelectFile(files[0])}
          isDisabled={isUploading}
          isEmbedded
        >
          {thumbnail?.previewURL ? (
            <img
              src={thumbnail.previewURL}
              alt="サムネイル画像のプレビュー"
              className={styles["preview-image"]}
            />
          ) : undefined}
        </UploadArea>
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
