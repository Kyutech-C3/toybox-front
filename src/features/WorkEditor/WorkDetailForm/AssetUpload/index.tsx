import { useRef, useState } from "react";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";

import useAssetUpload, { ASSET_ACCEPT } from "../hook/useAssetUpload";
import UploadPrompt from "../UploadPrompt";
import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

import type { ChangeEvent, DragEvent } from "react";

type AssetStatusSource = {
  kind: string;
  status: string;
  file?: unknown;
  errorMessage?: string;
};

/** 説明欄は 4:1 に収まる 2 行なので、種類と状態を 1 行にまとめる */
const getStatusText = ({
  kind,
  status,
  file,
  errorMessage,
}: AssetStatusSource) => {
  if (status === "uploading") return `${kind}・アップロード中`;
  if (status === "success" && file) return `${kind}・アップロード完了`;
  if (status === "error") return errorMessage ?? `${kind}・アップロードに失敗`;
  return kind;
};

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
      <h3 className={styles["heading"]}>アセット</h3>
      <div className={styles["asset-grid"]}>
        {assets.map((asset) => (
          <article
            className={styles["asset-card"]}
            key={asset.key}
            data-status={asset.status}
          >
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
              <div className={styles["overlay-actions"]}>
                {asset.status === "error" && (
                  <UploadRetryButton
                    className={styles["overlay-button"]}
                    onClick={() => handleRetry(asset.key)}
                    isDisabled={false}
                    ariaLabel={`${asset.fileName}を再アップロード`}
                  />
                )}
                <UploadRemoveButton
                  className={styles["overlay-button"]}
                  onClick={() => handleRemove(asset.key)}
                  isDisabled={asset.status === "uploading"}
                  ariaLabel={`${asset.fileName}を削除`}
                />
              </div>
            </div>
            <div className={styles["asset-details"]}>
              <span className={styles["file-name"]} title={asset.fileName}>
                {asset.fileName}
              </span>
              <span
                className={styles["status"]}
                data-status={asset.status}
                title={getStatusText(asset)}
                role={asset.status === "error" ? "alert" : undefined}
                aria-live="polite"
              >
                {getStatusText(asset)}
              </span>
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
        / 1ファイル2GB以下
      </p>
    </section>
  );
};

export default AssetUpload;
