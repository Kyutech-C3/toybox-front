import { useEffect, useRef, useState } from "react";

import { getExtension } from "../../editorAsset";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";
import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadArea from "../UploadArea";
import UploadCard from "../UploadCard";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import FieldError from "@/shared/ui/FieldError";
import ImageEditorDialog from "@/shared/ui/ImageEditorDialog";
import LoadingImage from "@/shared/ui/LoadingImage";

type PendingThumbnailEdit = {
  file: File;
  isCurrent: () => boolean;
};

const ThumbnailImageUpload = () => {
  const {
    thumbnail,
    validationError,
    handleSelectFile,
    handleRetry,
    handleRemove,
  } = useThumbnailUpload();
  const { createRequestGuard } = useEditorRequestGuard();
  const [pendingEdit, setPendingEdit] = useState<PendingThumbnailEdit | null>(
    null,
  );
  const [editError, setEditError] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const originalRef = useRef<{ source: File; output: File } | null>(null);
  const isUploading = thumbnail?.status === "uploading";

  useEffect(() => () => requestRef.current?.abort(), []);

  const handleChooseImage = (file: File | undefined) => {
    if (!file) return;
    if (!THUMBNAIL_ACCEPT.split(",").includes(getExtension(file.name))) {
      setEditError("対応していない画像形式です");
      return;
    }
    setEditError("");
    setPendingEdit({ file, isCurrent: createRequestGuard() });
  };

  const handleEdit = async () => {
    if (!thumbnail || isUploading || isLoadingImage) return;
    setEditError("");
    if (thumbnail.file) {
      handleChooseImage(
        originalRef.current?.output === thumbnail.file
          ? originalRef.current.source
          : thumbnail.file,
      );
      return;
    }
    if (!thumbnail.assetURL) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const isCurrent = createRequestGuard();
    setIsLoadingImage(true);
    try {
      const response = await fetch(thumbnail.assetURL, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to load image");
      const blob = await response.blob();
      if (!isCurrent() || controller.signal.aborted) return;
      setPendingEdit({
        file: new File([blob], thumbnail.fileName, { type: blob.type }),
        isCurrent,
      });
    } catch {
      if (isCurrent() && !controller.signal.aborted) {
        setEditError(
          "画像を読み込めませんでした。端末から画像を選択してください。",
        );
      }
    } finally {
      if (isCurrent()) setIsLoadingImage(false);
    }
  };

  const handleApply = (file: File) => {
    if (!pendingEdit?.isCurrent()) return;
    originalRef.current = { source: pendingEdit.file, output: file };
    handleSelectFile(file);
    setPendingEdit(null);
  };

  return (
    <div className={styles["upload-container"]}>
      <h3 className={styles["upload-heading"]}>サムネイル</h3>
      <UploadCard
        asset={thumbnail}
        hasPreview={!!thumbnail?.previewURL}
        onRemove={() => {
          requestRef.current?.abort();
          setIsLoadingImage(false);
          setEditError("");
          handleRemove();
          originalRef.current = null;
        }}
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
          onSelectFiles={(files) => handleChooseImage(files[0])}
          isDisabled={isUploading || isLoadingImage}
          isEmbedded
        >
          {thumbnail?.previewURL ? (
            <LoadingImage
              src={thumbnail.previewURL}
              alt="サムネイル画像のプレビュー"
              className={styles["preview-image"]}
            />
          ) : undefined}
        </UploadArea>
      </UploadCard>
      {thumbnail && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => void handleEdit()}
          disabled={isUploading}
          isLoading={isLoadingImage}
        >
          画像を編集
        </Button>
      )}
      {(editError || validationError || thumbnail?.errorMessage) && (
        <FieldError role="alert">
          {editError || validationError || thumbnail?.errorMessage}
        </FieldError>
      )}
      <p className={styles["format-help"]}>
        PNG・JPG・JPEG・BMP・GIF・WEBP / 加工後5MB以下
      </p>
      <p className={styles["format-help"]}>
        推奨比率 4:3。選択後に切り抜きと解像度を調整できます。
      </p>
      {pendingEdit?.isCurrent() && (
        <ImageEditorDialog
          file={pendingEdit.file}
          purpose="thumbnail"
          onConfirm={handleApply}
          onClose={() => setPendingEdit(null)}
        />
      )}
    </div>
  );
};

const ImageUpload = () => {
  const sessionVersion = useWorkEditorStore((state) => state.sessionVersion);
  return <ThumbnailImageUpload key={sessionVersion} />;
};

export default ImageUpload;
