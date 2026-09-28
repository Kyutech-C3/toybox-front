import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import styles from "../index.module.css";

import Button from "@/shared/ui/Button";
import LoadingImage from "@/shared/ui/LoadingImage";

import type { ComponentProps, Ref } from "react";
import type { ExtraProps } from "react-markdown";

export const IMAGE_LINK_CONTEXT = createContext(false);

export type PreviewImage = { src: string; alt: string };
type ImageView = { scale: number; x: number; y: number };
export type MarkdownImageDialogHandle = { open: (image: PreviewImage) => void };
type MarkdownImageDialogProps = { ref: Ref<MarkdownImageDialogHandle> };
type MarkdownImageProps = ComponentProps<"img"> &
  ExtraProps & { onOpen: (image: PreviewImage) => void };

const MAX_IMAGE_WIDTH = 2000;
const MAX_IMAGE_SCALE = 5;
const INITIAL_IMAGE_VIEW: ImageView = { scale: 1, x: 0, y: 0 };

const getImagePixelWidth = (value: unknown): number | undefined => {
  if (typeof value !== "string" && typeof value !== "number") return;
  const match = /^([1-9]\d{0,3})(?:px)?$/.exec(String(value).trim());
  if (!match) return;
  const width = Number(match[1]);
  return width <= MAX_IMAGE_WIDTH ? width : undefined;
};

const MarkdownImage = ({
  node,
  width,
  style,
  src,
  alt = "",
  onOpen,
  ...props
}: MarkdownImageProps) => {
  const isLinked = useContext(IMAGE_LINK_CONTEXT);
  const displayWidth =
    getImagePixelWidth(style?.width) ?? getImagePixelWidth(width);
  const image = (
    <LoadingImage
      {...props}
      src={src}
      alt={alt}
      width={displayWidth}
      style={displayWidth ? { width: displayWidth } : undefined}
      isIntrinsic
    />
  );

  if (isLinked || !src) return image;

  return (
    <button
      type="button"
      className={styles["image-open-button"]}
      aria-label={alt ? `${alt}を全画面表示` : "画像を全画面表示"}
      onClick={() => onOpen({ src, alt })}
    >
      {image}
    </button>
  );
};

export function MarkdownImageDialog({ ref }: MarkdownImageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<PreviewImage | null>(
    null,
  );
  const [imageView, setImageView] = useState<ImageView>(INITIAL_IMAGE_VIEW);

  useEffect(() => {
    if (!fullscreenImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreenImage]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const image = imageRef.current;
      if (!image) return;
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? dialog.clientHeight
            : 1;
      setImageView((current) => {
        const scale = event.ctrlKey
          ? Math.min(
              MAX_IMAGE_SCALE,
              Math.max(
                1,
                current.scale * Math.exp(-event.deltaY * unit * 0.002),
              ),
            )
          : current.scale;
        const maxX = Math.max(
          0,
          (image.clientWidth * scale - dialog.clientWidth) / 2,
        );
        const maxY = Math.max(
          0,
          (image.clientHeight * scale - dialog.clientHeight) / 2,
        );
        const clampX = (value: number) =>
          Math.max(-maxX, Math.min(maxX, value));
        const clampY = (value: number) =>
          Math.max(-maxY, Math.min(maxY, value));
        if (!event.ctrlKey) {
          return {
            ...current,
            x: clampX(current.x - event.deltaX * unit),
            y: clampY(current.y - event.deltaY * unit),
          };
        }
        const bounds = dialog.getBoundingClientRect();
        const pointerX = event.clientX - (bounds.left + bounds.width / 2);
        const pointerY = event.clientY - (bounds.top + bounds.height / 2);
        const ratio = scale / current.scale;
        return {
          scale,
          x: clampX(current.x + (pointerX - current.x) * (1 - ratio)),
          y: clampY(current.y + (pointerY - current.y) * (1 - ratio)),
        };
      });
    };
    dialog.addEventListener("wheel", handleWheel, { passive: false });
    return () => dialog.removeEventListener("wheel", handleWheel);
  }, []);

  useImperativeHandle(ref, () => ({
    open(image) {
      setImageView(INITIAL_IMAGE_VIEW);
      setFullscreenImage(image);
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      dialog.showModal();
    },
  }));

  return (
    <dialog
      ref={dialogRef}
      className={styles["image-dialog"]}
      aria-label="画像の全画面表示"
      onClose={() => {
        if (!dialogRef.current?.open) setFullscreenImage(null);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        dialogRef.current?.close();
      }}
    >
      <Button
        className={styles["image-dialog-close"]}
        variant="secondary"
        isIconOnly
        icon={<CloseRoundedIcon />}
        aria-label="全画面表示を閉じる"
        onClick={() => dialogRef.current?.close()}
      />
      {fullscreenImage && (
        <img
          ref={imageRef}
          src={fullscreenImage.src}
          alt={fullscreenImage.alt}
          style={{
            transform: `translate3d(${imageView.x}px, ${imageView.y}px, 0) scale(${imageView.scale})`,
          }}
        />
      )}
    </dialog>
  );
}

export default MarkdownImage;
