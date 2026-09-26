import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";

import useAssetUpload, { ASSET_ACCEPT } from "../hook/useAssetUpload";
import UploadArea from "../UploadArea";
import UploadCard from "../UploadCard";
import styles from "./index.module.css";

import FieldError from "@/shared/ui/FieldError";

type AssetStatusSource = {
  kind: string;
  status: string;
  file?: unknown;
  errorMessage?: string;
};

/** 説明欄は 4:1 に収まる 2 行なので、種類と状態を 1 行にまとめる */
const getStatusText = ({
  kind,
  status,
  file,
  errorMessage,
}: AssetStatusSource) => {
  if (status === "uploading") return `${kind}・アップロード中`;
  if (status === "success" && file) return `${kind}・アップロード完了`;
  if (status === "error") return errorMessage ?? `${kind}・アップロードに失敗`;
  return kind;
};

const AssetUpload = () => {
  const { assets, validationError, handleAddFiles, handleRetry, handleRemove } =
    useAssetUpload();
  return (
    <section className={styles["asset-upload"]}>
      <h3 className={styles["heading"]}>アセット</h3>
      <div className={styles["asset-grid"]}>
        {assets.map((asset) => (
          <UploadCard
            key={asset.key}
            asset={asset}
            previewClassName={styles["preview"]}
            statusText={getStatusText(asset)}
            onRemove={() => handleRemove(asset.key)}
            onRetry={() => handleRetry(asset.key)}
          >
            {asset.kind === "画像" && asset.previewURL && (
              <img src={asset.previewURL} alt="" />
            )}
            {asset.kind === "動画" && asset.previewURL && (
              <video src={asset.previewURL} muted aria-label="動画プレビュー" />
            )}
            {asset.kind === "音声" && <AudiotrackRoundedIcon />}
            {asset.kind === "ZIP" && <FolderZipRoundedIcon />}
          </UploadCard>
        ))}
        <UploadArea
          accept={ASSET_ACCEPT}
          ariaLabel="アセットを追加"
          onSelectFiles={handleAddFiles}
          isMultiple
        />
      </div>
      {validationError && (
        <FieldError role="alert">{validationError}</FieldError>
      )}
      <p className={styles["format-help"]}>
        画像（PNG・JPG・JPEG・BMP・GIF・WEBP）、動画（MP4・MOV）、音声（MP3・WAV・M4A）、ZIP
        / 1ファイル2GB以下
      </p>
    </section>
  );
};

export default AssetUpload;
