import { useRef, useState } from "react";

import { getExtension } from "../../editorAsset";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";
import useThumbnailUpload, {
  THUMBNAIL_ACCEPT,
} from "../hook/useThumbnailUpload";
import UploadCard from "../UploadCard";
import styles from "./index.module.css";

import EditButton from "@/shared/ui/EditButton";
import FieldError from "@/shared/ui/FieldError";
import ImageEditorDialog from "@/shared/ui/ImageEditorDialog";
import LoadingImage from "@/shared/ui/LoadingImage";
import UploadArea from "@/shared/ui/UploadArea";

import type { ImageEditState } from "@/shared/ui/ImageEditorDialog";

type PendingThumbnailEdit = {
  file: File;
  isCurrent: () => boolean;
  initialEdit?: ImageEditState;
};

const ThumbnailImageUpload = () => {
  const editorStore = useWorkEditorStoreApi();
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
    file: File;
    output: File;
    edit?: ImageEditState;
  } | null>(null);
  const processingSequenceRef = useRef(0);
  const isUploading = thumbnail?.status === "uploading";

  const hasOriginalImage =
    originalImage !== null && originalImage.output === thumbnail?.file;

  const handleChooseImage = (file: File | undefined) => {
    if (!file || isUploading) return;
    if (!THUMBNAIL_ACCEPT.split(",").includes(getExtension(file.name))) {
      setEditError("対応していない画像形式です");
      return;
    }
    setEditError("");
    const sequence = ++processingSequenceRef.current;
    const isCurrentSession = createRequestGuard();
    const isCurrent = () =>
      isCurrentSession() &&
      sequence === processingSequenceRef.current &&
      thumbnail === editorStore.getState().current.thumbnail;
    setPendingEdit({ file, isCurrent });
  };

  const handleEdit = () => {
    if (!hasOriginalImage || isUploading) return;
    const sequence = ++processingSequenceRef.current;
    const isCurrentSession = createRequestGuard();
    const isCurrent = () =>
      isCurrentSession() &&
      sequence === processingSequenceRef.current &&
      thumbnail === editorStore.getState().current.thumbnail;
    setPendingEdit({
      file: originalImage.file,
      initialEdit: originalImage.edit,
      isCurrent,
    });
  };

  const handleApply = (file: File, edit: ImageEditState) => {
    if (!pendingEdit?.isCurrent()) return;
    if (handleSelectFile(file)) {
      setOriginalImage({ file: pendingEdit.file, output: file, edit });
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
          onSelectFiles={(files) => handleChooseImage(files[0])}
          isDisabled={isUploading}
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
          <EditButton
            className={styles["edit-action"]}
            ariaLabel="サムネイル画像を編集"
            onEdit={handleEdit}
            isDisabled={isUploading}
          />
        )}
      </UploadCard>
      {(editError || validationError || thumbnail?.errorMessage) && (
        <FieldError role="alert">
          {editError || validationError || thumbnail?.errorMessage}
        </FieldError>
      )}
      {pendingEdit?.isCurrent() && (
        <ImageEditorDialog
          file={pendingEdit.file}
          purpose="thumbnail"
          initialEdit={pendingEdit.initialEdit}
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
