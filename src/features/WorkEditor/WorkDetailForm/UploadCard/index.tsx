import UploadRemoveButton from "../UploadRemoveButton";
import UploadRetryButton from "../UploadRetryButton";
import styles from "./index.module.css";

import type { ReactNode } from "react";
import type { EditorAsset } from "../../types";

type UploadCardProps = {
  asset: EditorAsset | null;
  children: ReactNode;
  statusText?: string;
  hasPreview?: boolean;
  previewClassName?: string;
  onRemove: () => void;
  onRetry: () => void;
};

const UploadCard = ({
  asset,
  children,
  statusText = "",
  hasPreview = true,
  previewClassName,
  onRemove,
  onRetry,
}: UploadCardProps) => (
  <div
    className={styles["upload-card"]}
    data-status={asset?.status ?? "empty"}
    data-has-preview={hasPreview ? "true" : "false"}
  >
    <div
      className={[styles["preview"], previewClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {asset && (
        <div className={styles["actions"]}>
          {asset.status === "error" && (
            <UploadRetryButton
              className={styles["action-button"]}
              onClick={onRetry}
              isDisabled={false}
              ariaLabel={`${asset.fileName}を再アップロード`}
            />
          )}
          <UploadRemoveButton
            className={styles["action-button"]}
            onClick={onRemove}
            isDisabled={asset.status === "uploading"}
            ariaLabel={`${asset.fileName}を削除`}
          />
        </div>
      )}
    </div>
    {asset && (
      <div className={styles["details"]}>
        <span className={styles["file-name"]} title={asset.fileName}>
          {asset.fileName}
        </span>
        <span
          className={styles["status"]}
          data-status={asset.status}
          title={statusText}
          role={asset.status === "error" ? "alert" : undefined}
          aria-live="polite"
        >
          {statusText}
        </span>
      </div>
    )}
  </div>
);

export default UploadCard;
