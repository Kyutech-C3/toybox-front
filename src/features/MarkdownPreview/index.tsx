import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
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
import MarkdownHeading, {
  findMarkdownTarget,
  openContainingDetails,
} from "./MarkdownHeading";
import MarkdownImage, {
  IMAGE_LINK_CONTEXT,
  MarkdownImageDialog,
} from "./MarkdownImage";
import { MarkdownInput, MarkdownListItem } from "./MarkdownTaskList";
import { MARKDOWN_SCHEMA } from "./markdownSchema";
import rehypeMarkdownFeatures, {
  HEADING_ID_PREFIX,
} from "./rehypeMarkdownFeatures";
import remarkSoftBreaks from "./remarkSoftBreaks";

import type { MouseEvent } from "react";
import type { MarkdownImageDialogHandle, PreviewImage } from "./MarkdownImage";

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
