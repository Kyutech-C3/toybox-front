import { useEffect, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import styles from "./index.module.css";

type ImageUploadProps = {
  onImageSelect: (file: File) => Promise<void>;
  onRemove: () => void;
};

const THUMBNAIL_ACCEPT = ".png,.jpg,.jpeg,.bmp,.gif";
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

type UploadStatus = "idle" | "uploading" | "success" | "error";

const ImageUpload = ({ onImageSelect, onRemove }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const replacePreview = (nextPreview: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = nextPreview;
    setPreview(nextPreview);
  };

  const uploadFile = async (nextFile: File) => {
    setStatus("uploading");
    setErrorMessage("");
    try {
      await onImageSelect(nextFile);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("アップロードに失敗しました");
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setErrorMessage("ファイルサイズは5MB以下にしてください");
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!THUMBNAIL_ACCEPT.split(",").includes(extension)) {
      setErrorMessage("対応していない画像形式です");
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    replacePreview(nextPreview);
    setFile(file);
    void uploadFile(file);
  };

  const handleClick = () => {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (status === "uploading") return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
    e.target.value = "";
  };

  const handleRemove = () => {
    if (status === "uploading") return;
    replacePreview(null);
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    onRemove();
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
          data-has-image={preview ? "true" : "false"}
          disabled={status === "uploading"}
          aria-label="サムネイル画像をアップロード"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={THUMBNAIL_ACCEPT}
            onChange={handleInputChange}
            className={styles["file-input"]}
            tabIndex={-1}
          />
          {preview ? (
            <img
              src={preview}
              alt="アップロードされた画像のプレビュー"
              className={styles["preview-image"]}
            />
          ) : (
            <CloudUploadRoundedIcon
              style={{
                fontSize: 128,
                color: isDragging
                  ? "var(--primary-color)"
                  : "var(--font-muted-color)",
              }}
            />
          )}
        </button>
        {file && status !== "uploading" && (
          <button
            type="button"
            className={styles["remove-button"]}
            onClick={handleRemove}
            aria-label="サムネイルを削除"
          >
            <CloseRoundedIcon />
          </button>
        )}
      </div>
      <div className={styles["upload-meta"]} aria-live="polite">
        {file && <span className={styles["file-name"]}>{file.name}</span>}
        {status === "uploading" && <span>アップロード中</span>}
        {status === "success" && <span>アップロード完了</span>}
        {status === "error" && file && (
          <button type="button" onClick={() => void uploadFile(file)}>
            再試行
          </button>
        )}
      </div>
      {errorMessage && (
        <p className={styles["error-message"]} role="alert">
          {errorMessage}
        </p>
      )}
      <p className={styles["format-help"]}>
        PNG・JPG・JPEG・BMP・GIF / 5MB以下
      </p>
    </div>
  );
};

export default ImageUpload;
