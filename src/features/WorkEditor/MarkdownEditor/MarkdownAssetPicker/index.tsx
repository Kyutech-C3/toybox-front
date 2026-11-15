import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import LoadingImage from "@/shared/ui/LoadingImage";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";

import type { EditorAsset } from "../../types";

type MarkdownAssetPickerProps = {
  assets: EditorAsset[];
  selectedKey: string;
  onSelect: (asset: EditorAsset) => void;
};

type MarkdownAssetActionsProps = {
  selectedAsset: EditorAsset;
  onInsert: (markdown: string) => boolean;
};

const getDefaultAltText = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "");

const getImageMarkdown = (altText: string, url: string) => {
  const escapedAltText = altText
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
  const escapedURL = url.replaceAll("(", "%28").replaceAll(")", "%29");
  return `![${escapedAltText}](${escapedURL})`;
};

export const getAssetImageMarkdown = (asset: EditorAsset) =>
  getImageMarkdown(getDefaultAltText(asset.fileName), asset.assetURL ?? "");

const escapeHTMLAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const getAssetMarkdown = (asset: EditorAsset) => {
  if (asset.kind === "画像") return getAssetImageMarkdown(asset);
  const tag = asset.kind === "動画" ? "video" : "audio";
  return `<${tag} controls src="${escapeHTMLAttribute(asset.assetURL ?? "")}" title="${escapeHTMLAttribute(getDefaultAltText(asset.fileName))}"></${tag}>`;
};

const MarkdownAssetPicker = ({
  assets,
  selectedKey,
  onSelect,
}: MarkdownAssetPickerProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const selectedAsset =
    assets.find((asset) => asset.key === selectedKey) ?? assets[0];
  const activeAssetKey = selectedAsset?.key;

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    },
    [],
  );

  const handleCopy = async (asset: EditorAsset) => {
    if (!(await copyTextToClipboard(getAssetMarkdown(asset)))) return;
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    setCopiedKey(asset.key);
    copyResetTimerRef.current = window.setTimeout(
      () => setCopiedKey(null),
      2000,
    );
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const button = activeButtonRef.current;
    if (!list || !button || !activeAssetKey) return;
    const listBounds = list.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    const nextLeft =
      list.scrollLeft +
      buttonBounds.left -
      listBounds.left +
      buttonBounds.width / 2 -
      list.clientWidth / 2;
    list.scrollTo({
      left: Math.min(
        Math.max(nextLeft, 0),
        list.scrollWidth - list.clientWidth,
      ),
      behavior: "instant",
    });
  }, [activeAssetKey]);

  if (!selectedAsset?.assetURL) return null;

  return (
    <section
      className={styles["asset-picker"]}
      aria-label="説明に画像・動画・音声を入れる"
    >
      <div ref={listRef} className={styles["asset-list"]}>
        {assets.map((asset) => (
          <div key={asset.key} className={styles["asset-item"]}>
            <button
              ref={
                selectedAsset.key === asset.key ? activeButtonRef : undefined
              }
              type="button"
              className={styles["asset-button"]}
              data-active={selectedAsset.key === asset.key}
              aria-pressed={selectedAsset.key === asset.key}
              aria-label={`${asset.fileName}を選択`}
              title={`${asset.kind}：${asset.fileName}`}
              onClick={() => onSelect(asset)}
            >
              {asset.kind === "画像" && asset.previewURL ? (
                <LoadingImage src={asset.previewURL} alt="" loading="lazy" />
              ) : asset.kind === "動画" ? (
                <MovieOutlinedIcon aria-hidden="true" />
              ) : asset.kind === "音声" ? (
                <AudiotrackRoundedIcon aria-hidden="true" />
              ) : (
                <ImageOutlinedIcon aria-hidden="true" />
              )}
            </button>
            <span className={styles["asset-file-name"]} title={asset.fileName}>
              {asset.fileName}
            </span>
            <Button
              className={styles["asset-copy-button"]}
              size="compact"
              variant="secondary"
              isIconOnly
              icon={
                copiedKey === asset.key ? (
                  <CheckRoundedIcon />
                ) : (
                  <ContentCopyRoundedIcon />
                )
              }
              aria-label={
                copiedKey === asset.key
                  ? `${asset.fileName}をコピーしました`
                  : `${asset.fileName}の Markdown をコピー`
              }
              title={
                copiedKey === asset.key
                  ? "コピーしました"
                  : `${asset.kind}の Markdown をコピー`
              }
              onClick={() => void handleCopy(asset)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export const MarkdownAssetActions = ({
  selectedAsset,
  onInsert,
}: MarkdownAssetActionsProps) => {
  const [isInserted, setInserted] = useState(false);
  const insertResetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (insertResetTimerRef.current !== null) {
        window.clearTimeout(insertResetTimerRef.current);
      }
    },
    [],
  );

  const markdown = getAssetMarkdown(selectedAsset);
  const handleInsert = () => {
    if (!onInsert(markdown)) return;
    if (insertResetTimerRef.current !== null) {
      window.clearTimeout(insertResetTimerRef.current);
    }
    setInserted(true);
    insertResetTimerRef.current = window.setTimeout(
      () => setInserted(false),
      2000,
    );
  };

  return (
    <div className={styles["action-row"]}>
      <Button
        size="small"
        icon={isInserted ? <CheckRoundedIcon /> : <AddRoundedIcon />}
        aria-label={
          isInserted ? `${selectedAsset.kind}を挿入しました` : undefined
        }
        onClick={handleInsert}
      >
        挿入
      </Button>
    </div>
  );
};

export default MarkdownAssetPicker;
