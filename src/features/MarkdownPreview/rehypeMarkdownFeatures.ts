import { visit } from "unist-util-visit";

import type { Root } from "hast";

export const HEADING_ID_PREFIX = "markdown-heading-";
export const PROTECTED_ID_PREFIX = "user-content-";
export const getMarkdownAnchor = (
  id: string,
  prefix = PROTECTED_ID_PREFIX,
): string => (id.startsWith(prefix) ? id.slice(prefix.length) : id);

const ALERT_TYPES = new Set(["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]);

// sanitize 後に、保護された ID と参照先を一致させる。
// 著者が指定した ID の prefix を取り除くことはしない。
const rehypeMarkdownFeatures =
  ({ clobberPrefix = PROTECTED_ID_PREFIX }: { clobberPrefix?: string } = {}) =>
  (tree: Root) => {
    const targets = new Map<string, { id: string; anchor: string }>();
    const protectedTargets = new Map<string, { id: string; anchor: string }>();
    visit(tree, "element", (node, _index, parent) => {
      if (node.tagName === "video" || node.tagName === "audio") {
        node.properties.controls = true;
        node.properties.preload = "none";
        node.properties.ariaLabel =
          node.properties.title || (node.tagName === "video" ? "動画" : "音声");
        if (node.tagName === "video") node.properties.playsInline = true;
      }

      const id = node.properties.id;
      if (typeof id === "string") {
        const anchor = getMarkdownAnchor(id, clobberPrefix);
        node.properties.dataMarkdownAnchor = anchor;
        const isHeading = /^h[1-6]$/.test(node.tagName);
        const isFootnoteLabel =
          parent?.type === "element" && parent.properties.dataFootnotes;
        if (isHeading && !isFootnoteLabel)
          node.properties.dataMarkdownHeading = anchor;
        const target = { id, anchor };
        // Match the first target, as native fragment navigation does. Public IDs
        // take priority over legacy links that contain an internal prefix.
        if (!targets.has(anchor)) targets.set(anchor, target);
        if (!protectedTargets.has(id)) protectedTargets.set(id, target);
        // Continue accepting previously shared links containing internal IDs.
        const legacyId = `${PROTECTED_ID_PREFIX}${anchor}`;
        if (!protectedTargets.has(legacyId))
          protectedTargets.set(legacyId, target);
        if (isHeading) {
          const legacyHeadingId = `${PROTECTED_ID_PREFIX}${HEADING_ID_PREFIX}${anchor}`;
          if (!protectedTargets.has(legacyHeadingId))
            protectedTargets.set(legacyHeadingId, target);
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
      // Sanitizing IDs does not update IDREF attributes such as the label used
      // by footnote references. Keep those references on the actual DOM IDs.
      for (const property of ["ariaDescribedBy", "ariaLabelledBy"]) {
        const references = node.properties[property];
        if (!references) continue;
        const ids = Array.isArray(references)
          ? references.map(String)
          : String(references).split(/\s+/);
        node.properties[property] = ids.map(
          (id) => (targets.get(id) ?? protectedTargets.get(id))?.id ?? id,
        );
      }
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
      let target = targets.get(fragment) ?? protectedTargets.get(fragment);
      let legacyAnchor = fragment;
      while (!target && legacyAnchor.startsWith(PROTECTED_ID_PREFIX)) {
        legacyAnchor = legacyAnchor.slice(PROTECTED_ID_PREFIX.length);
        target =
          targets.get(legacyAnchor) ?? protectedTargets.get(legacyAnchor);
      }
      if (target) {
        node.properties.href = `#${encodeURIComponent(target.anchor)}`;
      }
    });
  };

export default rehypeMarkdownFeatures;
