import { useRef, useState } from "react";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";

import useAssetUpload, { ASSET_ACCEPT } from "../hook/useAssetUpload";
import UploadPrompt from "../UploadPrompt";
import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

import type { ChangeEvent, DragEvent } from "react";

const AssetUpload = () => {
  const { assets, validationError, handleAddFiles, handleRetry, handleRemove } =
    useAssetUpload();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleAddFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section className={styles["asset-upload"]}>
      <h2 className={styles["heading"]}>アセット</h2>
      <div className={styles["asset-grid"]}>
        {assets.map((asset) => (
          <article className={styles["asset-card"]} key={asset.key}>
            <div className={styles["preview"]}>
              {asset.kind === "画像" && asset.previewURL && (
                <img src={asset.previewURL} alt="" />
              )}
              {asset.kind === "動画" && asset.previewURL && (
                <video
                  src={asset.previewURL}
                  muted
                  aria-label="動画プレビュー"
                />
              )}
              {asset.kind === "音声" && <AudiotrackRoundedIcon />}
              {asset.kind === "ZIP" && <FolderZipRoundedIcon />}
              <UploadRemoveButton
                className={styles["remove-button"]}
                onClick={() => handleRemove(asset.key)}
                isDisabled={asset.status === "uploading"}
                ariaLabel={`${asset.fileName}を削除`}
              />
            </div>
            <div className={styles["asset-details"]}>
              <span className={styles["file-name"]} title={asset.fileName}>
                {asset.fileName}
              </span>
              <span>{asset.kind}</span>
              <span data-status={asset.status} aria-live="polite">
                {asset.status === "uploading" && "アップロード中"}
                {asset.status === "success" && asset.file && "アップロード完了"}
                {asset.status === "error" && asset.errorMessage}
              </span>
              {asset.status === "error" && (
                <UploadRetryButton onClick={() => handleRetry(asset.key)} />
              )}
            </div>
          </article>
        ))}
        <input
          ref={fileInputRef}
          className={styles["file-input"]}
          type="file"
          accept={ASSET_ACCEPT}
          multiple
          onChange={handleInputChange}
          tabIndex={-1}
        />
        <button
          type="button"
          className={styles["add-button"]}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          data-dragging={isDragging ? "true" : "false"}
          aria-label="アセットを追加"
        >
          <UploadPrompt />
        </button>
      </div>
      {validationError && (
        <p className={styles["validation-error"]} role="alert">
          {validationError}
        </p>
      )}
      <p className={styles["format-help"]}>
        画像（PNG・JPG・JPEG・BMP・GIF）、動画（MP4・MOV）、音声（MP3・WAV・M4A）、ZIP
        / 1ファイル100MB以下
      </p>
    </section>
  );
};

export default AssetUpload;
