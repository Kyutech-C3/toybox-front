import { useRef, useState } from "react";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import styles from "./index.module.css";

type ImageUploadProps = {
  label?: string;
  onImageSelect: (file: File) => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
  previewUrl?: string;
};

const ImageUpload = ({
  onImageSelect,
  acceptedFormats = "image/png, image/jpeg, image/jpg, image/webp, image/gif, image/bmp",
  maxSizeMB = 5,
  previewUrl,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`ファイルサイズは${maxSizeMB}MB以下にしてください`);
      return;
    }

    // ファイル形式チェック
    const acceptedTypes = acceptedFormats.split(", ");
    if (!acceptedTypes.includes(file.type)) {
      alert("サポートされていないファイル形式です");
      return;
    }

    // プレビュー生成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleClick = () => {
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
  };

  return (
    <div className={styles["upload-container"]}>
      <span className={styles["upload-label"]}>サムネイル</span>
      <button
        type="button"
        className={styles["upload-area"]}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dragging={isDragging ? "true" : "false"}
        data-has-image={preview ? "true" : "false"}
        aria-label="画像をアップロード"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
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
              color: isDragging ? "var(--primary-color)" : "#999",
            }}
          />
        )}
      </button>
    </div>
  );
};

export default ImageUpload;
