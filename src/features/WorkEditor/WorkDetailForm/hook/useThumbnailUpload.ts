import { useRef, useState } from "react";

import { deletePendingResources } from "../../api/deletePendingResources";
import { uploadAsset } from "../../api/uploadAsset";
import { createUploadingAsset, getExtension } from "../../editorAsset";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { EditorAsset } from "../../types";

export const THUMBNAIL_ACCEPT = ".png,.jpg,.jpeg,.bmp,.gif,.webp";
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

type UseThumbnailUploadReturn = {
  thumbnail: EditorAsset | null;
  validationError: string;
  handleSelectFile: (file: File | null) => void;
  handleRetry: () => void;
  handleRemove: () => void;
};

const useThumbnailUpload = (): UseThumbnailUploadReturn => {
  const thumbnail = useWorkEditorStore((state) => state.current.thumbnail);
  const setThumbnail = useWorkEditorStore((state) => state.setThumbnail);
  const updateThumbnail = useWorkEditorStore((state) => state.updateThumbnail);
  const removeThumbnail = useWorkEditorStore((state) => state.removeThumbnail);
  const addUploadedAssetID = useWorkEditorStore(
    (state) => state.addUploadedAssetID,
  );
  const [validationError, setValidationError] = useState("");
  const { createRequestGuard } = useEditorRequestGuard();
  const requestSequenceRef = useRef(0);

  const upload = async (file: File) => {
    updateThumbnail({ status: "uploading", assetID: null, errorMessage: "" });
    const isCurrentSession = createRequestGuard();
    const requestSequence = ++requestSequenceRef.current;
    const isCurrentRequest = () =>
      isCurrentSession() && requestSequence === requestSequenceRef.current;
    try {
      const { accessToken, sessionVersion: authSessionVersion } =
        useAuthStore.getState();
      if (!accessToken) throw new Error("No access token available");
      const response = await uploadAsset(file, accessToken);
      if (!response.id) throw new Error("Failed to upload asset");
      if (!isCurrentRequest()) {
        if (useAuthStore.getState().sessionVersion !== authSessionVersion)
          return;
        void deletePendingResources(
          { assetIDs: [response.id], tagIDs: [] },
          accessToken,
        );
        return;
      }
      updateThumbnail({ status: "success", assetID: response.id });
      addUploadedAssetID(response.id);
    } catch {
      if (!isCurrentRequest()) return;
      updateThumbnail({
        status: "error",
        errorMessage: "アップロードに失敗しました",
      });
    }
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_THUMBNAIL_SIZE) {
      setValidationError("ファイルサイズは5MB以下にしてください");
      return;
    }
    if (!THUMBNAIL_ACCEPT.split(",").includes(getExtension(file.name))) {
      setValidationError("対応していない画像形式です");
      return;
    }

    setValidationError("");
    setThumbnail(createUploadingAsset(file));
    void upload(file);
  };

  const handleRetry = () => {
    if (!thumbnail?.file || thumbnail.status !== "error") return;
    void upload(thumbnail.file);
  };

  const handleRemove = () => {
    if (thumbnail?.status === "uploading") return;
    setValidationError("");
    removeThumbnail();
  };

  return {
    thumbnail,
    validationError,
    handleSelectFile,
    handleRetry,
    handleRemove,
  };
};

export default useThumbnailUpload;
