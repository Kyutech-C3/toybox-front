import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";

import { getSafeAssetURL } from "../assetUrl";
import styles from "./index.module.css";

import type { Asset } from "@/shared/types/work";

type AssetNavigatorProps = {
  assets: Asset[];
  activeAssetIndex: number;
  failedAssetIDs: Set<string>;
  onSelect: (assetIndex: number) => void;
};

const getFileIcon = (assetType: string) => {
  if (assetType === "video") return MovieRoundedIcon;
  if (assetType === "music") return MusicNoteRoundedIcon;
  if (assetType === "zip") return FolderZipRoundedIcon;
  return InsertDriveFileRoundedIcon;
};

const AssetNavigator = ({
  assets,
  activeAssetIndex,
  failedAssetIDs,
  onSelect,
}: AssetNavigatorProps) => {
  return (
    <nav className={styles["asset-navigator"]} aria-label="アセットの一覧">
      <ul className={styles["asset-navigator-list"]}>
        {assets.map((asset, assetIndex) => {
          const safeURL = getSafeAssetURL(asset.url);
          const isImage =
            asset.asset_type === "image" &&
            !!safeURL &&
            !failedAssetIDs.has(asset.id);
          const FileIcon = getFileIcon(asset.asset_type);
          const isActive = assetIndex === activeAssetIndex;

          return (
            <li key={asset.id}>
              <button
                type="button"
                className={styles["asset-thumbnail"]}
                data-active={isActive}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${assetIndex + 1}番目のアセットを表示`}
                onClick={() => onSelect(assetIndex)}
              >
                {isImage ? (
                  <img
                    src={safeURL}
                    alt=""
                    className={styles["asset-thumbnail-image"]}
                    loading="lazy"
                  />
                ) : (
                  <FileIcon
                    className={styles["asset-thumbnail-icon"]}
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AssetNavigator;
