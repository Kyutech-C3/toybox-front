import { useState } from "react";

import { deletePendingResources } from "../../api/deletePendingResources";
import { uploadAsset } from "../../api/uploadAsset";
import {
  createUploadingAsset,
  getExtension,
  getFileAssetKey,
} from "../../editorAsset";
import useEditorRequestGuard from "../../hook/useEditorRequestGuard";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { EditorAsset } from "../../types";

export const ASSET_ACCEPT =
  ".png,.jpg,.jpeg,.bmp,.gif,.webp,.mp4,.mov,.mp3,.wav,.m4a,.zip";
export const IMAGE_ASSET_ACCEPT = ".png,.jpg,.jpeg,.bmp,.gif,.webp";
const MAX_ASSET_SIZE = 2000 * 1024 * 1024;

type UseAssetUploadReturn = {
  assets: EditorAsset[];
  validationError: string;
  handleAddFiles: (files: File[]) => void;
  handleAddImageFile: (file: File) => Promise<EditorAsset | null>;
  handleRetry: (key: string) => void;
  handleRemove: (key: string) => void;
};

const useAssetUpload = (): UseAssetUploadReturn => {
  const assets = useWorkEditorStore((state) => state.current.assets);
  const description = useWorkEditorStore((state) => state.current.description);
  const addAssets = useWorkEditorStore((state) => state.addAssets);
  const updateAsset = useWorkEditorStore((state) => state.updateAsset);
  const removeAsset = useWorkEditorStore((state) => state.removeAsset);
  const addUploadedAssetID = useWorkEditorStore(
    (state) => state.addUploadedAssetID,
  );
  const store = useWorkEditorStoreApi();
  const [validationError, setValidationError] = useState("");
  const { createRequestGuard } = useEditorRequestGuard();

  const upload = async (
    key: string,
    file: File,
  ): Promise<EditorAsset | null> => {
    updateAsset(key, {
      status: "uploading",
      assetID: null,
      assetURL: null,
      errorMessage: "",
    });
    const isCurrentRequest = createRequestGuard();
    try {
      const { accessToken, sessionVersion: authSessionVersion } =
        useAuthStore.getState();
      if (!accessToken) throw new Error("No access token available");
      const response = await uploadAsset(file, accessToken);
      if (!response.id) throw new Error("Failed to upload asset");
      if (!response.url) {
        if (useAuthStore.getState().sessionVersion === authSessionVersion)
          void deletePendingResources(
            { assetIDs: [response.id], tagIDs: [] },
            accessToken,
          );
        throw new Error("Failed to upload asset URL");
      }
      if (!isCurrentRequest()) {
        if (useAuthStore.getState().sessionVersion !== authSessionVersion)
          return null;
        void deletePendingResources(
          { assetIDs: [response.id], tagIDs: [] },
          accessToken,
        );
        return null;
      }
      updateAsset(key, {
        status: "success",
        assetID: response.id,
        assetURL: response.url,
      });
      addUploadedAssetID(response.id);
      return (
        store.getState().current.assets.find((asset) => asset.key === key) ??
        null
      );
    } catch {
      if (!isCurrentRequest()) return null;
      updateAsset(key, {
        status: "error",
        errorMessage: "アップロードに失敗しました",
      });
      return null;
    }
  };

  const handleAddImageFile = async (
    file: File,
  ): Promise<EditorAsset | null> => {
    if (!IMAGE_ASSET_ACCEPT.split(",").includes(getExtension(file.name))) {
      setValidationError(`${file.name} は対応していない画像形式です`);
      return null;
    }
    if (file.size > MAX_ASSET_SIZE) {
      setValidationError(`${file.name} は2GBを超えています`);
      return null;
    }
    const key = getFileAssetKey(file);
    const existing = store
      .getState()
      .current.assets.find((asset) => asset.key === key);
    if (existing) {
      if (existing.status === "success" && existing.assetURL) {
        setValidationError("");
        return existing;
      }
      setValidationError(`${file.name} は追加済みです`);
      return null;
    }

    setValidationError("");
    addAssets([createUploadingAsset(file)]);
    const isCurrentSession = createRequestGuard();
    const uploaded = await upload(key, file);
    if (!uploaded && isCurrentSession())
      setValidationError("画像のアップロードに失敗しました");
    return uploaded;
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
        messages.push(`${file.name} は2GBを超えています`);
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
    const markdownURL = target.assetURL
      ?.replaceAll("(", "%28")
      .replaceAll(")", "%29");
    if (
      target.assetURL &&
      (description.includes(target.assetURL) ||
        (markdownURL !== undefined && description.includes(markdownURL)))
    ) {
      setValidationError(
        `${target.fileName} は説明欄で使用中です。説明欄から画像を外してから削除してください`,
      );
      return;
    }
    setValidationError("");
    removeAsset(key);
  };

  return {
    assets,
    validationError,
    handleAddFiles,
    handleAddImageFile,
    handleRetry,
    handleRemove,
  };
};

export default useAssetUpload;
