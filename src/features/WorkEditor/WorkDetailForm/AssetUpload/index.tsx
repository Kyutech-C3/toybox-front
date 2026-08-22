import { useEffect, useRef, useState } from "react";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";

import UploadPrompt from "../UploadPrompt";
import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

type AssetUploadProps = {
  onUpload: (file: File) => Promise<string>;
  onRemove: (assetID: string) => void;
};

type AssetStatus = "uploading" | "success" | "error";

type AssetItem = {
  key: string;
  file: File;
  previewUrl: string | null;
  kind: "画像" | "動画" | "音声" | "ZIP";
  status: AssetStatus;
  assetID: string | null;
  errorMessage: string;
};

const ASSET_ACCEPT = ".png,.jpg,.jpeg,.bmp,.gif,.mp4,.mov,.mp3,.wav,.m4a,.zip";
const MAX_ASSET_SIZE = 100 * 1024 * 1024;

const getFileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

const getExtension = (file: File) =>
  `.${file.name.split(".").pop()?.toLowerCase()}`;

const getAssetKind = (file: File): AssetItem["kind"] => {
  const extension = getExtension(file);
  if ([".png", ".jpg", ".jpeg", ".bmp", ".gif"].includes(extension)) {
    return "画像";
  }
  if ([".mp4", ".mov"].includes(extension)) return "動画";
  if ([".mp3", ".wav", ".m4a"].includes(extension)) return "音声";
  return "ZIP";
};

const canPreview = (kind: AssetItem["kind"]) =>
  kind === "画像" || kind === "動画";

const AssetUpload = ({ onUpload, onRemove }: AssetUploadProps) => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetsRef = useRef<AssetItem[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      for (const asset of assetsRef.current) {
        if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
      }
    };
  }, []);

  const updateAsset = (key: string, update: Partial<AssetItem>) => {
    if (!isMountedRef.current) return;
    setAssets((currentAssets) =>
      currentAssets.map((asset) =>
        asset.key === key ? { ...asset, ...update } : asset,
      ),
    );
  };

  const upload = async (key: string, file: File) => {
    updateAsset(key, {
      status: "uploading",
      assetID: null,
      errorMessage: "",
    });
    try {
      const assetID = await onUpload(file);
      updateAsset(key, { status: "success", assetID });
    } catch {
      updateAsset(key, {
        status: "error",
        errorMessage: "アップロードに失敗しました",
      });
    }
  };

  const addFiles = (files: File[]) => {
    const acceptedExtensions = ASSET_ACCEPT.split(",");
    const existingKeys = new Set(assetsRef.current.map((asset) => asset.key));
    const nextAssets: AssetItem[] = [];
    const messages: string[] = [];

    for (const file of files) {
      const key = getFileKey(file);
      if (existingKeys.has(key)) {
        messages.push(`${file.name} は追加済みです`);
        continue;
      }
      if (!acceptedExtensions.includes(getExtension(file))) {
        messages.push(`${file.name} は対応していない形式です`);
        continue;
      }
      if (file.size > MAX_ASSET_SIZE) {
        messages.push(`${file.name} は100MBを超えています`);
        continue;
      }

      existingKeys.add(key);
      const kind = getAssetKind(file);
      nextAssets.push({
        key,
        file,
        kind,
        previewUrl: canPreview(kind) ? URL.createObjectURL(file) : null,
        status: "uploading",
        assetID: null,
        errorMessage: "",
      });
    }

    setValidationError(messages.join("\n"));
    if (nextAssets.length === 0) return;
    setAssets((currentAssets) => [...currentAssets, ...nextAssets]);
    for (const asset of nextAssets) void upload(asset.key, asset.file);
  };

  const handleRemove = (key: string) => {
    const asset = assetsRef.current.find((item) => item.key === key);
    if (!asset || asset.status === "uploading") return;
    if (asset.assetID) onRemove(asset.assetID);
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    setAssets((currentAssets) =>
      currentAssets.filter((item) => item.key !== key),
    );
  };

  const handleRetry = (asset: AssetItem) => {
    if (asset.status !== "error") return;
    void upload(asset.key, asset.file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section className={styles["asset-upload"]}>
      <h2 className={styles["heading"]}>アセット</h2>
      <div className={styles["asset-grid"]}>
        {assets.map((asset) => (
          <article className={styles["asset-card"]} key={asset.key}>
            <div className={styles["preview"]}>
              {asset.kind === "画像" && asset.previewUrl && (
                <img src={asset.previewUrl} alt="" />
              )}
              {asset.kind === "動画" && asset.previewUrl && (
                <video
                  src={asset.previewUrl}
                  muted
                  aria-label="動画プレビュー"
                />
              )}
              {asset.kind === "音声" && <AudiotrackRoundedIcon />}
              {asset.kind === "ZIP" && <FolderZipRoundedIcon />}
              <UploadRemoveButton
                className={styles["remove-button"]}
                onClick={() => handleRemove(asset.key)}
                isDisabled={asset.status === "uploading"}
                ariaLabel={`${asset.file.name}を削除`}
              />
            </div>
            <div className={styles["asset-details"]}>
              <span className={styles["file-name"]} title={asset.file.name}>
                {asset.file.name}
              </span>
              <span>{asset.kind}</span>
              <span data-status={asset.status} aria-live="polite">
                {asset.status === "uploading" && "アップロード中"}
                {asset.status === "success" && "アップロード完了"}
                {asset.status === "error" && asset.errorMessage}
              </span>
              {asset.status === "error" && (
                <UploadRetryButton onClick={() => handleRetry(asset)} />
              )}
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
        / 1ファイル100MB以下
      </p>
    </section>
  );
};

export default AssetUpload;
