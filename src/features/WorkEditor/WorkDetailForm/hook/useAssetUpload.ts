import { flushSync } from "react-dom";

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
import { removeAssetImageMarkdown } from "../removeAssetImageMarkdown";

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
  const addAssets = useWorkEditorStore((state) => state.addAssets);
  const updateAsset = useWorkEditorStore((state) => state.updateAsset);
  const removeAsset = useWorkEditorStore((state) => state.removeAsset);
  const setDescription = useWorkEditorStore((state) => state.setDescription);
  const addUploadedAssetID = useWorkEditorStore(
    (state) => state.addUploadedAssetID,
  );
  const store = useWorkEditorStoreApi();
  const validationError = useWorkEditorStore((state) => state.assetUploadError);
  const setValidationError = useWorkEditorStore(
    (state) => state.setAssetUploadError,
  );
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
    return upload(key, file);
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
    const current = store.getState().current;
    const target = current.assets.find((asset) => asset.key === key);
    if (!target || target.status === "uploading") return;
    const imageUsage = target.assetURL
      ? removeAssetImageMarkdown(current.description, target.assetURL)
      : null;
    if (imageUsage?.hasUnsupportedReferences) {
      setValidationError(
        `${target.fileName} は説明文の HTML 画像で使用されています。説明文から画像を削除してからアセットを削除してください。`,
      );
      return;
    }
    if (imageUsage?.hasImageReferences) {
      if (
        !window.confirm(
          `${target.fileName} は下の説明文でも使用されています。削除すると説明文からも画像を削除します。`,
        )
      )
        return;
      if (store.getState().markdownMode === "preview") {
        flushSync(() => store.getState().setMarkdownMode("edit"));
      }
      const textarea = document.querySelector<HTMLTextAreaElement>(
        "[data-markdown-editor] .w-md-editor-text-input",
      );
      if (!textarea || textarea.value !== current.description) {
        setValidationError("説明文から画像を削除できませんでした");
        return;
      }
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(0, textarea.value.length);
      const command = imageUsage.nextDescription ? "insertText" : "delete";
      let didReplace = false;
      try {
        didReplace = document.execCommand(
          command,
          false,
          imageUsage.nextDescription,
        );
      } catch {
        // 入力履歴を保持できない場合はアセットも削除しない
      }
      if (!didReplace) {
        setValidationError("説明文から画像を削除できませんでした");
        return;
      }
      flushSync(() => setDescription(textarea.value));
      textarea.setSelectionRange(
        Math.min(selectionStart, textarea.value.length),
        Math.min(selectionEnd, textarea.value.length),
      );
      window.scrollTo(scrollX, scrollY);
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
