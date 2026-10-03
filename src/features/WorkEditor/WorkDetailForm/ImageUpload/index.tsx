import { useRef, useState } from "react";

import { getExtension } from "../../editorAsset";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";
import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadArea from "../UploadArea";
import UploadCard from "../UploadCard";
import styles from "./index.module.css";
import { prepareThumbnailImage } from "./prepareThumbnailImage";

import Button from "@/shared/ui/Button";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
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
  const [originalImage, setOriginalImage] = useState<{
    source: File;
    output: File;
  } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const processingSequenceRef = useRef(0);
  const isUploading = thumbnail?.status === "uploading";

  const hasOriginalImage =
    originalImage !== null && originalImage.output === thumbnail?.file;

  const handleChooseImage = async (file: File | undefined) => {
    if (!file) return;
    if (!THUMBNAIL_ACCEPT.split(",").includes(getExtension(file.name))) {
      setEditError("対応していない画像形式です");
      return;
    }
    setEditError("");
    setIsProcessingImage(true);
    const sequence = ++processingSequenceRef.current;
    const isCurrentSession = createRequestGuard();
    const isCurrent = () =>
      isCurrentSession() && sequence === processingSequenceRef.current;
    try {
      const output = await prepareThumbnailImage(file);
      if (!isCurrent()) return;
      if (handleSelectFile(output)) setOriginalImage({ source: file, output });
    } catch {
      if (isCurrent())
        setEditError(
          "画像を加工できませんでした。別の画像を選択してください。",
        );
    } finally {
      if (isCurrent()) setIsProcessingImage(false);
    }
  };

  const handleEdit = () => {
    if (!hasOriginalImage || isUploading || isProcessingImage) return;
    setPendingEdit({
      file: originalImage.source,
      isCurrent: createRequestGuard(),
    });
  };

  const handleApply = (file: File) => {
    if (!pendingEdit?.isCurrent()) return;
    if (handleSelectFile(file)) {
      setOriginalImage({ source: pendingEdit.file, output: file });
    }
    setPendingEdit(null);
  };

  return (
    <div className={styles["upload-container"]}>
      <h3 className={styles["upload-heading"]}>サムネイル</h3>
      <UploadCard
        asset={thumbnail}
        hasPreview={!!thumbnail?.previewURL}
        onRemove={() => {
          processingSequenceRef.current += 1;
          setIsProcessingImage(false);
          setEditError("");
          handleRemove();
          setOriginalImage(null);
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
          onSelectFiles={(files) => void handleChooseImage(files[0])}
          isDisabled={isUploading || isProcessingImage}
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
        {hasOriginalImage && (
          <div className={styles["edit-action"]}>
            <Button
              variant="secondary"
              size="small"
              isIconOnly
              icon={<EditSquareIcon />}
              ariaLabel="サムネイル画像を編集"
              onClick={handleEdit}
              disabled={isUploading || isProcessingImage}
            />
          </div>
        )}
      </UploadCard>
      {isProcessingImage && (
        <p className={styles["format-help"]} role="status">
          画像を加工中
        </p>
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
        選択時に
        4:3・長辺1600px以下に加工します。左下の編集アイコンから再調整できます。
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
