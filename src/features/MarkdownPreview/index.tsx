import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { toString as getText } from "hast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import "katex/dist/katex.min.css";

import CodeBlock from "./CodeBlock";
import styles from "./index.module.css";
import MarkdownAlert from "./MarkdownAlert";
import { MARKDOWN_SCHEMA } from "./markdownSchema";
import rehypeMarkdownFeatures, {
  getHeadingSlug,
  HEADING_ID_PREFIX,
  PROTECTED_HEADING_ID_PREFIX,
} from "./rehypeMarkdownFeatures";
import remarkSoftBreaks from "./remarkSoftBreaks";

import Button from "@/shared/ui/Button";
import LoadingImage from "@/shared/ui/LoadingImage";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";

import type { ComponentProps, MouseEvent, Ref } from "react";
import type { ExtraProps } from "react-markdown";

const TASK_LABEL_CONTEXT = createContext<string | undefined>(undefined);
const IMAGE_LINK_CONTEXT = createContext(false);
const MAX_IMAGE_WIDTH = 2000;

type PreviewImage = { src: string; alt: string };
type ImageView = { scale: number; x: number; y: number };
type MarkdownImageDialogHandle = { open: (image: PreviewImage) => void };
type MarkdownImageDialogProps = { ref: Ref<MarkdownImageDialogHandle> };
const INITIAL_IMAGE_VIEW: ImageView = { scale: 1, x: 0, y: 0 };
const MAX_IMAGE_SCALE = 5;

const getImagePixelWidth = (value: unknown): number | undefined => {
  if (typeof value !== "string" && typeof value !== "number") return;
  const match = /^([1-9]\d{0,3})(?:px)?$/.exec(String(value).trim());
  if (!match) return;
  const width = Number(match[1]);
  return width <= MAX_IMAGE_WIDTH ? width : undefined;
};

const openContainingDetails = (target: HTMLElement) => {
  let details = target.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
};

const findMarkdownTarget = (container: HTMLElement, fragment: string) => {
  const directTarget = document.getElementById(fragment);
  if (directTarget && container.contains(directTarget)) return directTarget;

  const heading = document.getElementById(
    `${PROTECTED_HEADING_ID_PREFIX}${fragment}`,
  );
  return heading &&
    /^H[1-6]$/.test(heading.tagName) &&
    container.contains(heading)
    ? heading
    : null;
};

type MarkdownListItemProps = ComponentProps<"li"> & ExtraProps;

const MarkdownListItem = ({ node, ...props }: MarkdownListItemProps) => {
  const generatedID = useId();
  const labelID = props.id ?? generatedID;
  return (
    <TASK_LABEL_CONTEXT.Provider value={labelID}>
      <li {...props} id={labelID} />
    </TASK_LABEL_CONTEXT.Provider>
  );
};

type MarkdownHeadingProps = ComponentProps<"h1"> & ExtraProps;

const MarkdownHeading = ({
  node,
  children,
  id,
  ...props
}: MarkdownHeadingProps) => {
  const titleID = useId();
  const headingSlug = id ? getHeadingSlug(id) : undefined;
  const name = node?.tagName;
  const Tag =
    name === "h1" ||
    name === "h2" ||
    name === "h3" ||
    name === "h4" ||
    name === "h5" ||
    name === "h6"
      ? name
      : "h2";
  // 脚注の見出しは参照用 ID を保持し、本文の見出しリンクとは分ける。
  return (
    <Tag {...props} id={id} aria-labelledby={titleID}>
      <span id={titleID}>{children}</span>
      {headingSlug !== undefined ? (
        <a
          className={styles["heading-link"]}
          href={`#${encodeURIComponent(headingSlug)}`}
          aria-label={`「${node ? getText(node) : "見出し"}」へのリンクをコピー`}
          onClick={(event) => {
            if (
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            const href = event.currentTarget.href;
            const target = event.currentTarget.parentElement;
            if (target) {
              openContainingDetails(target);
              window.location.hash = `#${encodeURIComponent(headingSlug)}`;
              target.scrollIntoView();
            }
            void copyTextToClipboard(href);
          }}
        >
          <LinkRoundedIcon
            className={styles["heading-link-icon"]}
            aria-hidden="true"
          />
        </a>
      ) : null}
    </Tag>
  );
};

type MarkdownInputProps = ComponentProps<"input"> & ExtraProps;

const MarkdownInput = ({ node, ...props }: MarkdownInputProps) => {
  const labelID = useContext(TASK_LABEL_CONTEXT);
  return <input {...props} aria-labelledby={labelID} />;
};

type MarkdownImageProps = ComponentProps<"img"> &
  ExtraProps & { onOpen: (image: PreviewImage) => void };

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

function MarkdownImageDialog({ ref }: MarkdownImageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? dialog.clientHeight
            : 1;
      setImageView((current) => {
        if (!event.ctrlKey) {
          return {
            ...current,
            x: current.x - event.deltaX * unit,
            y: current.y - event.deltaY * unit,
          };
        }
        const scale = Math.min(
          MAX_IMAGE_SCALE,
          Math.max(1, current.scale * Math.exp(-event.deltaY * unit * 0.002)),
        );
        const bounds = dialog.getBoundingClientRect();
        const pointerX = event.clientX - (bounds.left + bounds.width / 2);
        const pointerY = event.clientY - (bounds.top + bounds.height / 2);
        const ratio = scale / current.scale;
        return {
          scale,
          x: current.x + (pointerX - current.x) * (1 - ratio),
          y: current.y + (pointerY - current.y) * (1 - ratio),
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

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageDialogRef = useRef<MarkdownImageDialogHandle>(null);
  const restoredHashRef = useRef<string | undefined>(undefined);

  const handleOpenImage = (image: PreviewImage) => {
    imageDialogRef.current?.open(image);
  };

  useEffect(() => {
    // 本文が非同期で読み込まれたときも共有 URL の見出しへ移動する。
    if (!content.trim()) return;
    const restoreHash = () => {
      let fragment = "";
      try {
        fragment = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!fragment || restoredHashRef.current === fragment) return;
      const container = containerRef.current;
      const target = container && findMarkdownTarget(container, fragment);
      if (target) {
        openContainingDetails(target);
        target.scrollIntoView();
        restoredHashRef.current = fragment;
      }
    };
    restoreHash();
    const handleHashChange = () => {
      restoredHashRef.current = undefined;
      restoreHash();
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [content]);

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    const href = event.currentTarget.getAttribute("href");
    if (!href?.startsWith("#")) return;
    let fragment = "";
    try {
      fragment = decodeURIComponent(href.slice(1));
    } catch {
      return;
    }
    const container = containerRef.current;
    const target = container && findMarkdownTarget(container, fragment);
    if (!target) return;
    openContainingDetails(target);
    if (target.id !== fragment) {
      event.preventDefault();
      window.location.hash = href;
      target.scrollIntoView();
    }
  };

  return (
    <div className={styles["markdown-preview"]} ref={containerRef}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath, remarkSoftBreaks]}
        remarkRehypeOptions={{
          footnoteLabel: "脚注",
          footnoteBackLabel: "本文へ戻る",
        }}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSlug, { prefix: HEADING_ID_PREFIX }],
          [rehypeSanitize, MARKDOWN_SCHEMA],
          // 入力を検査してから、KaTeX が必要とする MathML と装飾を生成する。
          [rehypeKatex, { trust: false, errorColor: "var(--error-color)" }],
          rehypeMarkdownFeatures,
        ]}
        components={{
          h1: MarkdownHeading,
          h2: MarkdownHeading,
          h3: MarkdownHeading,
          h4: MarkdownHeading,
          h5: MarkdownHeading,
          h6: MarkdownHeading,
          blockquote: MarkdownAlert,
          table({ node, ...props }) {
            return (
              <div className={styles["table-scroll"]}>
                <table {...props} />
              </div>
            );
          },
          li: MarkdownListItem,
          img(props) {
            return <MarkdownImage {...props} onOpen={handleOpenImage} />;
          },
          input: MarkdownInput,
          a({ node, href, ...props }) {
            let isExternal = false;
            if (href) {
              try {
                const url = new URL(href, window.location.href);
                isExternal =
                  (url.protocol === "http:" || url.protocol === "https:") &&
                  url.origin !== window.location.origin;
              } catch {
                // 不正な URL は現在のタブで扱う。
              }
            }
            const image = node?.children.find(
              (child) => child.type === "element" && child.tagName === "img",
            );
            const imageLabel =
              node &&
              !getText(node).trim() &&
              image?.type === "element" &&
              typeof image.properties.alt === "string"
                ? image.properties.alt
                : undefined;
            return (
              <IMAGE_LINK_CONTEXT.Provider value={!!image}>
                <a
                  {...props}
                  href={href}
                  aria-label={props["aria-label"] ?? imageLabel}
                  onClick={href ? handleLinkClick : undefined}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                />
              </IMAGE_LINK_CONTEXT.Provider>
            );
          },
          pre({ node, children, ...props }) {
            const code = node?.children.find(
              (child) => child.type === "element" && child.tagName === "code",
            );
            if (code?.type !== "element")
              return <pre {...props}>{children}</pre>;
            const classNames = code.properties.className;
            const languageClass = Array.isArray(classNames)
              ? classNames.find(
                  (name) =>
                    typeof name === "string" && name.startsWith("language-"),
                )
              : undefined;
            const info =
              typeof languageClass === "string"
                ? languageClass.slice("language-".length)
                : "";
            const separator = info.indexOf(":");
            const language = separator < 0 ? info : info.slice(0, separator);
            const fileName =
              separator < 0 ? undefined : info.slice(separator + 1);
            return (
              <CodeBlock language={language || undefined} fileName={fileName}>
                {getText(code).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </Markdown>
      <MarkdownImageDialog ref={imageDialogRef} />
    </div>
  );
};

export default MarkdownPreview;
