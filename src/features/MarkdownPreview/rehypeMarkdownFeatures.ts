import { visit } from "unist-util-visit";

import type { Root } from "hast";

export const HEADING_ID_PREFIX = "markdown-heading-";
export const PROTECTED_HEADING_ID_PREFIX = `user-content-${HEADING_ID_PREFIX}`;

export const getHeadingSlug = (id: string): string | undefined =>
  id.startsWith(PROTECTED_HEADING_ID_PREFIX)
    ? id.slice(PROTECTED_HEADING_ID_PREFIX.length)
    : undefined;

const ALERT_TYPES = new Set(["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]);

// sanitize 後に、保護された ID と参照先を一致させる。
// 著者が指定した ID の prefix を取り除くことはしない。
const rehypeMarkdownFeatures = () => (tree: Root) => {
  const targets = new Map<string, string>();
  visit(tree, "element", (node) => {
    const id = node.properties.id;
    if (typeof id === "string") {
      targets.set(id, id);
      if (id.startsWith("user-content-")) {
        const originalID = id.slice("user-content-".length);
        targets.set(originalID, id);
        if (originalID.startsWith(HEADING_ID_PREFIX)) {
          targets.set(originalID.slice(HEADING_ID_PREFIX.length), id);
        }
      }
    }

    if (node.tagName !== "blockquote") return;
    const paragraphIndex = node.children.findIndex(
      (child) => child.type === "element",
    );
    const paragraph = node.children[paragraphIndex];
    if (paragraph?.type !== "element" || paragraph.tagName !== "p") return;
    const marker = paragraph.children[0];
    if (marker?.type !== "text") return;
    const match = /^\[!([A-Z]+)\](?:\n|$)/.exec(marker.value);
    if (!match || !ALERT_TYPES.has(match[1])) return;
    marker.value = marker.value.slice(match[0].length);
    if (!marker.value) paragraph.children.shift();
    if (
      paragraph.children[0]?.type === "element" &&
      paragraph.children[0].tagName === "br"
    ) {
      paragraph.children.shift();
    }
    if (!paragraph.children.length) node.children.splice(paragraphIndex, 1);
    node.properties.dataMarkdownAlert = match[1];
  });

  visit(tree, "element", (node) => {
    const href = node.properties.href;
    if (
      node.tagName !== "a" ||
      typeof href !== "string" ||
      !href.startsWith("#")
    )
      return;
    let fragment = "";
    try {
      fragment = decodeURIComponent(href.slice(1));
    } catch {
      return;
    }
    const target = targets.get(fragment);
    if (target) {
      node.properties.href = `#${encodeURIComponent(getHeadingSlug(target) ?? target)}`;
    }
  });
};

export default rehypeMarkdownFeatures;
