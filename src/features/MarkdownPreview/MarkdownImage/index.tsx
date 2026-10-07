import {
  createContext,
  useCallback,
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

import type { ComponentProps, PointerEvent, Ref } from "react";
import type { ExtraProps } from "react-markdown";

export const IMAGE_LINK_CONTEXT = createContext(false);

export type PreviewImage = { src: string; alt: string };
type ImageView = { scale: number; x: number; y: number };
type ImagePoint = { x: number; y: number };
export type MarkdownImageDialogHandle = { open: (image: PreviewImage) => void };
type MarkdownImageDialogProps = { ref: Ref<MarkdownImageDialogHandle> };
type MarkdownImageProps = ComponentProps<"img"> &
  ExtraProps & { onOpen: (image: PreviewImage) => void };

const MAX_IMAGE_WIDTH = 2000;
const MAX_IMAGE_SCALE = 5;
const IMAGE_CLICK_TOLERANCE = 5;
const INITIAL_IMAGE_VIEW: ImageView = { scale: 1, x: 0, y: 0 };

const clampImageView = (
  view: ImageView,
  image: HTMLImageElement,
  viewport: HTMLElement,
): ImageView => {
  if (!image.naturalWidth || !image.naturalHeight) return INITIAL_IMAGE_VIEW;
  const fit = Math.min(
    viewport.clientWidth / image.naturalWidth,
    viewport.clientHeight / image.naturalHeight,
  );
  const maxX = Math.max(
    0,
    (image.naturalWidth * fit * view.scale - viewport.clientWidth) / 2,
  );
  const maxY = Math.max(
    0,
    (image.naturalHeight * fit * view.scale - viewport.clientHeight) / 2,
  );
  return {
    ...view,
    x: Math.max(-maxX, Math.min(maxX, view.x)),
    y: Math.max(-maxY, Math.min(maxY, view.y)),
  };
};

const zoomImageView = (
  view: ImageView,
  requestedScale: number,
  point: ImagePoint,
): ImageView => {
  const scale = Math.min(MAX_IMAGE_SCALE, Math.max(1, requestedScale));
  const ratio = scale / view.scale;
  return {
    scale,
    x: view.x + (point.x - view.x) * (1 - ratio),
    y: view.y + (point.y - view.y) * (1 - ratio),
  };
};

const getImageGesture = (pointers: Map<number, ImagePoint>) => {
  const [first, second] = pointers.values();
  if (!first) return;
  if (!second) return { ...first, distance: 0 };
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  };
};

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef(new Map<number, ImagePoint>());
  const outsideClickRef = useRef<(ImagePoint & { pointerId: number }) | null>(
    null,
  );
  const [fullscreenImage, setFullscreenImage] = useState<PreviewImage | null>(
    null,
  );
  const [imageView, setImageView] = useState<ImageView>(INITIAL_IMAGE_VIEW);

  const updateImageView = useCallback(
    (transform: (current: ImageView) => ImageView) => {
      const viewport = viewportRef.current;
      const image = imageRef.current;
      if (!viewport || !image) return;
      setImageView((current) =>
        clampImageView(transform(current), image, viewport),
      );
    },
    [],
  );

  useEffect(() => {
    if (!fullscreenImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreenImage]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? viewport.clientHeight
            : 1;
      updateImageView((current) => {
        if (event.shiftKey && !event.ctrlKey) {
          return {
            ...current,
            x: current.x - event.deltaX * unit,
            y: current.y - event.deltaY * unit,
          };
        }
        const bounds = viewport.getBoundingClientRect();
        return zoomImageView(
          current,
          current.scale * Math.exp(-event.deltaY * unit * 0.002),
          {
            x: event.clientX - (bounds.left + bounds.width / 2),
            y: event.clientY - (bounds.top + bounds.height / 2),
          },
        );
      });
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [updateImageView]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!fullscreenImage || !viewport) return;
    const observer = new ResizeObserver(() =>
      updateImageView((current) => current),
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fullscreenImage, updateImageView]);

  const isOutsideImage = (point: ImagePoint) => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return false;
    const bounds = image.getBoundingClientRect();
    const fit = Math.min(
      bounds.width / image.naturalWidth,
      bounds.height / image.naturalHeight,
    );
    const width = image.naturalWidth * fit;
    const height = image.naturalHeight * fit;
    const left = bounds.left + (bounds.width - width) / 2;
    const top = bounds.top + (bounds.height - height) / 2;
    return (
      point.x < left ||
      point.x > left + width ||
      point.y < top ||
      point.y > top + height
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || pointersRef.current.size >= 2) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    outsideClickRef.current =
      pointersRef.current.size === 0 && isOutsideImage(point)
        ? { ...point, pointerId: event.pointerId }
        : null;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    const outsideClick = outsideClickRef.current;
    if (
      outsideClick &&
      Math.hypot(
        event.clientX - outsideClick.x,
        event.clientY - outsideClick.y,
      ) > IMAGE_CLICK_TOLERANCE
    ) {
      outsideClickRef.current = null;
    }
    const previous = getImageGesture(pointers);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const gesture = getImageGesture(pointers);
    if (!previous || !gesture) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    updateImageView((current) => {
      const zoomed = zoomImageView(
        current,
        previous.distance > 0
          ? current.scale * (gesture.distance / previous.distance)
          : current.scale,
        {
          x: previous.x - (bounds.left + bounds.width / 2),
          y: previous.y - (bounds.top + bounds.height / 2),
        },
      );
      return {
        ...zoomed,
        x: zoomed.x + gesture.x - previous.x,
        y: zoomed.y + gesture.y - previous.y,
      };
    });
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const outsideClick = outsideClickRef.current;
    outsideClickRef.current = null;
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (
      event.type === "pointerup" &&
      outsideClick?.pointerId === event.pointerId &&
      Math.hypot(
        event.clientX - outsideClick.x,
        event.clientY - outsideClick.y,
      ) <= IMAGE_CLICK_TOLERANCE &&
      isOutsideImage({ x: event.clientX, y: event.clientY })
    ) {
      dialogRef.current?.close();
    }
  };

  useImperativeHandle(ref, () => ({
    open(image) {
      pointersRef.current.clear();
      outsideClickRef.current = null;
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
        if (!dialogRef.current?.open) {
          pointersRef.current.clear();
          outsideClickRef.current = null;
          setFullscreenImage(null);
        }
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
      <div
        ref={viewportRef}
        className={styles["image-dialog-viewport"]}
        data-zoomed={imageView.scale > 1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
      >
        {fullscreenImage && (
          <img
            key={fullscreenImage.src}
            ref={imageRef}
            src={fullscreenImage.src}
            alt={fullscreenImage.alt}
            draggable={false}
            style={{
              transform: `translate3d(${imageView.x}px, ${imageView.y}px, 0) scale(${imageView.scale})`,
            }}
          />
        )}
      </div>
    </dialog>
  );
}

export default MarkdownImage;
