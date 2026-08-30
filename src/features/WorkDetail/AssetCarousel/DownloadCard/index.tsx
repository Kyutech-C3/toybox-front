import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

import { getSafeAssetURL } from "../assetUrl";
import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";

type DownloadCardProps = {
  assetType: string;
  extension: string;
  isLoadError?: boolean;
  url: string;
};

const getExtensionLabel = (extension: string): string => {
  const trimmedExtension = extension.trim();

  if (!trimmedExtension) return "拡張子不明";
  return trimmedExtension.startsWith(".")
    ? trimmedExtension
    : `.${trimmedExtension}`;
};

const DownloadCard = ({
  assetType,
  extension,
  isLoadError = false,
  url,
}: DownloadCardProps) => {
  const safeURL = getSafeAssetURL(url);
  const extensionLabel = getExtensionLabel(extension);
  const isZip = assetType === "zip";
  const FileIcon = isZip ? FolderZipRoundedIcon : InsertDriveFileRoundedIcon;

  const description = isLoadError
    ? "プレビューを読み込めませんでした。ファイルをダウンロードして確認できます。"
    : isZip
      ? "ZIPファイルをダウンロードできます。"
      : "このファイル形式はプレビューに対応していません。";

  return (
    <CardWrapper>
      <div className={styles["download-card"]}>
        <FileIcon className={styles["file-icon"]} aria-hidden="true" />
        <p className={styles["extension"]}>{extensionLabel}</p>
        <p className={styles["description"]}>{description}</p>
        {safeURL ? (
          <div className={styles["download-actions"]}>
            <a
              className={styles["download-link"]}
              href={safeURL}
              target="_blank"
              rel="noopener noreferrer"
              download
              aria-label={`${extensionLabel}ファイルをダウンロード`}
            >
              <DownloadRoundedIcon aria-hidden="true" />
              ダウンロード
            </a>
          </div>
        ) : (
          <p className={styles["url-error"]} role="alert">
            このアセットのURLは安全に開けません。
          </p>
        )}
      </div>
    </CardWrapper>
  );
};

export default DownloadCard;
