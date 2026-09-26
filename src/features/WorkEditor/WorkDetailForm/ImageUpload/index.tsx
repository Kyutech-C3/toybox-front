import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadArea from "../UploadArea";
import UploadCard from "../UploadCard";
import styles from "./index.module.css";

import FieldError from "@/shared/ui/FieldError";

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
      <UploadCard
        asset={thumbnail}
        hasPreview={!!thumbnail?.previewURL}
        onRemove={handleRemove}
        onRetry={handleRetry}
        statusText={
          thumbnail?.status === "uploading"
            ? "アップロード中"
            : thumbnail?.status === "error"
              ? "アップロードに失敗"
              : thumbnail?.file
                ? "アップロード完了"
                : ""
        }
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
      </UploadCard>
      {(validationError || thumbnail?.errorMessage) && (
        <FieldError role="alert">
          {validationError || thumbnail?.errorMessage}
        </FieldError>
      )}
      <p className={styles["format-help"]}>
        PNG・JPG・JPEG・BMP・GIF・WEBP / 5MB以下
      </p>
    </div>
  );
};

export default ImageUpload;
