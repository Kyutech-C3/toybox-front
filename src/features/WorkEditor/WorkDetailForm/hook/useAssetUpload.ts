import { useState } from "react";

import { uploadAsset } from "../../api/uploadAsset";
import {
  createUploadingAsset,
  getExtension,
  getFileAssetKey,
} from "../../editorAsset";
import { useWorkEditorStore } from "../../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { EditorAsset } from "../../types";

export const ASSET_ACCEPT =
  ".png,.jpg,.jpeg,.bmp,.gif,.mp4,.mov,.mp3,.wav,.m4a,.zip";
const MAX_ASSET_SIZE = 100 * 1024 * 1024;

type UseAssetUploadReturn = {
  assets: EditorAsset[];
  validationError: string;
  handleAddFiles: (files: File[]) => void;
  handleRetry: (key: string) => void;
  handleRemove: (key: string) => void;
};

const useAssetUpload = (): UseAssetUploadReturn => {
  const assets = useWorkEditorStore((state) => state.current.assets);
  const addAssets = useWorkEditorStore((state) => state.addAssets);
  const updateAsset = useWorkEditorStore((state) => state.updateAsset);
  const removeAsset = useWorkEditorStore((state) => state.removeAsset);
  const [validationError, setValidationError] = useState("");

  const upload = async (key: string, file: File) => {
    updateAsset(key, { status: "uploading", assetID: null, errorMessage: "" });
    try {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) throw new Error("No access token available");
      const response = await uploadAsset(file, accessToken);
      if (!response.id) throw new Error("Failed to upload asset");
      updateAsset(key, { status: "success", assetID: response.id });
    } catch {
      updateAsset(key, {
        status: "error",
        errorMessage: "アップロードに失敗しました",
      });
    }
  };

  const handleAddFiles = (files: File[]) => {
    const acceptedExtensions = ASSET_ACCEPT.split(",");
    const existingKeys = new Set(assets.map((asset) => asset.key));
    const nextAssets: EditorAsset[] = [];
    const messages: string[] = [];

    for (const file of files) {
      const key = getFileAssetKey(file);
      if (existingKeys.has(key)) {
        messages.push(`${file.name} は追加済みです`);
        continue;
      }
      if (!acceptedExtensions.includes(getExtension(file.name))) {
        messages.push(`${file.name} は対応していない形式です`);
        continue;
      }
      if (file.size > MAX_ASSET_SIZE) {
        messages.push(`${file.name} は100MBを超えています`);
        continue;
      }

      existingKeys.add(key);
      nextAssets.push(createUploadingAsset(file));
    }

    setValidationError(messages.join("\n"));
    if (nextAssets.length === 0) return;
    addAssets(nextAssets);
    for (const asset of nextAssets) {
      if (asset.file) void upload(asset.key, asset.file);
    }
  };

  const handleRetry = (key: string) => {
    const target = assets.find((asset) => asset.key === key);
    if (!target?.file || target.status !== "error") return;
    void upload(key, target.file);
  };

  const handleRemove = (key: string) => {
    const target = assets.find((asset) => asset.key === key);
    if (!target || target.status === "uploading") return;
    removeAsset(key);
  };

  return {
    assets,
    validationError,
    handleAddFiles,
    handleRetry,
    handleRemove,
  };
};

export default useAssetUpload;
