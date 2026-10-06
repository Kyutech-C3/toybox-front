import { useId } from "react";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { toString as getText } from "hast-util-to-string";

import styles from "../index.module.css";
import {
  getHeadingSlug,
  PROTECTED_HEADING_ID_PREFIX,
} from "../rehypeMarkdownFeatures";

import useToast from "@/shared/ui/Toast/hook/useToast";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";

import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";

export const openContainingDetails = (target: HTMLElement) => {
  let details = target.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
};

export const findMarkdownTarget = (
  container: HTMLElement,
  fragment: string,
) => {
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

type MarkdownHeadingProps = ComponentProps<"h1"> & ExtraProps;

const MarkdownHeading = ({
  node,
  children,
  id,
  ...props
}: MarkdownHeadingProps) => {
  const { showToast } = useToast();
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
            void copyTextToClipboard(href).then((isCopied) => {
              showToast({
                message: isCopied
                  ? "リンクをコピーしました"
                  : "リンクをコピーできませんでした",
                severity: isCopied ? "success" : "error",
              });
            });
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

export default MarkdownHeading;
