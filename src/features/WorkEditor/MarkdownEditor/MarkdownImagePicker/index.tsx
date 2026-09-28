import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import LoadingImage from "@/shared/ui/LoadingImage";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";

import type { EditorAsset } from "../../types";

type MarkdownImagePickerProps = {
  images: EditorAsset[];
  selectedKey: string;
  onSelect: (asset: EditorAsset) => void;
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

const MarkdownImagePicker = ({
  images,
  selectedKey,
  onSelect,
  onInsert,
}: MarkdownImagePickerProps) => {
  const [isCopied, setCopied] = useState(false);
  const [isInserted, setInserted] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);
  const insertResetTimerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedImage =
    images.find((asset) => asset.key === selectedKey) ?? images[0];
  const activeImageKey = selectedImage?.key;

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      if (insertResetTimerRef.current !== null) {
        window.clearTimeout(insertResetTimerRef.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    const button = activeButtonRef.current;
    if (!list || !button || !activeImageKey) return;
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
  }, [activeImageKey]);

  if (!selectedImage?.assetURL) return null;

  const markdown = getAssetImageMarkdown(selectedImage);
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
  const handleCopy = async () => {
    const didCopy = await copyTextToClipboard(markdown);
    if (!didCopy) return;
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    setCopied(true);
    copyResetTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles["image-picker"]} aria-label="説明に画像を入れる">
      <div ref={listRef} className={styles["image-list"]}>
        {images.map((asset) => (
          <button
            key={asset.key}
            ref={selectedImage.key === asset.key ? activeButtonRef : undefined}
            type="button"
            className={styles["image-button"]}
            data-active={selectedImage.key === asset.key}
            aria-pressed={selectedImage.key === asset.key}
            aria-label={`${asset.fileName}を選択`}
            title={asset.fileName}
            onClick={() => {
              setCopied(false);
              setInserted(false);
              onSelect(asset);
            }}
          >
            {asset.previewURL ? (
              <LoadingImage src={asset.previewURL} alt="" loading="lazy" />
            ) : (
              <ImageOutlinedIcon aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <div className={styles["action-row"]}>
        <Button
          size="small"
          icon={
            isInserted ? <CheckRoundedIcon /> : <AddPhotoAlternateRoundedIcon />
          }
          aria-label={isInserted ? "画像を挿入しました" : undefined}
          onClick={handleInsert}
        >
          カーソル位置に挿入
        </Button>
        <Button
          size="small"
          variant="secondary"
          isIconOnly
          icon={isCopied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
          aria-label={isCopied ? "コピーしました" : "画像の Markdown をコピー"}
          title={isCopied ? "コピーしました" : "画像の Markdown をコピー"}
          onClick={() => void handleCopy()}
        />
      </div>
    </section>
  );
};

export default MarkdownImagePicker;
