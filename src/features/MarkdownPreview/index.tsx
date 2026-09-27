import { createContext, useContext, useEffect, useId, useRef } from "react";
import Markdown from "react-markdown";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { toString as getText } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import CodeBlock from "./CodeBlock";
import styles from "./index.module.css";
import MarkdownAlert from "./MarkdownAlert";
import { MARKDOWN_SCHEMA } from "./markdownSchema";
import rehypeMarkdownFeatures, {
  HEADING_ID_PREFIX,
} from "./rehypeMarkdownFeatures";

import LoadingImage from "@/shared/ui/LoadingImage";

import type { ComponentProps, MouseEvent } from "react";
import type { ExtraProps } from "react-markdown";

const TASK_LABEL_CONTEXT = createContext<string | undefined>(undefined);

const openContainingDetails = (target: HTMLElement) => {
  let details = target.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
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
      {id?.startsWith(`user-content-${HEADING_ID_PREFIX}`) ? (
        <a
          className={styles["heading-link"]}
          href={`#${encodeURIComponent(id)}`}
          aria-label={`「${node ? getText(node) : "見出し"}」へのリンク`}
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

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredHashRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // 本文が非同期で読み込まれたときも共有 URL の見出しへ移動する。
    if (!content.trim()) return;
    let fragment = "";
    try {
      fragment = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (!fragment || restoredHashRef.current === fragment) return;
    const target = document.getElementById(fragment);
    if (target && containerRef.current?.contains(target)) {
      openContainingDetails(target);
      target.scrollIntoView();
      restoredHashRef.current = fragment;
    }
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
    const target = document.getElementById(fragment);
    if (target && containerRef.current?.contains(target)) {
      openContainingDetails(target);
    }
  };

  return (
    <div className={styles["markdown-preview"]} ref={containerRef}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        remarkRehypeOptions={{
          footnoteLabel: "脚注",
          footnoteBackLabel: "本文へ戻る",
        }}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSlug, { prefix: HEADING_ID_PREFIX }],
          [rehypeSanitize, MARKDOWN_SCHEMA],
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
          li: MarkdownListItem,
          img({ node, ...props }) {
            return <LoadingImage {...props} isIntrinsic />;
          },
          input: MarkdownInput,
          a({ node, href, ...props }) {
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
              <a
                {...props}
                href={href}
                aria-label={props["aria-label"] ?? imageLabel}
                onClick={href ? handleLinkClick : undefined}
              />
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
    </div>
  );
};

export default MarkdownPreview;
