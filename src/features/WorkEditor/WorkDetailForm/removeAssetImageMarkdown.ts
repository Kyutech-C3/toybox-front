import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { Root } from "mdast";

type AssetImageMarkdownAnalysis = {
  nextDescription: string;
  hasImageReferences: boolean;
  hasUnsupportedReferences: boolean;
};

const MARKDOWN_PARSER = unified().use(remarkParse).use(remarkGfm);

const matchesAssetURL = (candidate: string, assetURL: string) =>
  candidate === assetURL ||
  candidate === assetURL.replaceAll("(", "%28").replaceAll(")", "%29");

export const removeAssetImageMarkdown = (
  description: string,
  assetURL: string,
): AssetImageMarkdownAnalysis => {
  const tree = MARKDOWN_PARSER.parse(description) as Root;
  const definitions = new Map<string, string>();
  const ranges: { start: number; end: number }[] = [];
  let hasUnsupportedReferences = false;

  visit(tree, "definition", (node) => {
    definitions.set(node.identifier, node.url);
  });

  visit(tree, (node) => {
    if (node.type === "image") {
      if (!matchesAssetURL(node.url, assetURL)) return;
    } else if (node.type === "imageReference") {
      const url = definitions.get(node.identifier);
      if (!url || !matchesAssetURL(url, assetURL)) return;
    } else if (node.type === "html") {
      if (typeof document === "undefined") return;
      const template = document.createElement("template");
      template.innerHTML = node.value;
      const hasMatchingImage = Array.from(
        template.content.querySelectorAll("img"),
      ).some((image) =>
        matchesAssetURL(image.getAttribute("src") ?? "", assetURL),
      );
      if (!hasMatchingImage) return;
      // 複数要素を含む HTML は、周囲の内容を巻き込まないよう手動編集を促す。
      if (!/^<img\b[^>]*\/?>\s*$/is.test(node.value)) {
        hasUnsupportedReferences = true;
        return;
      }
    } else {
      return;
    }

    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      hasUnsupportedReferences = true;
      return;
    }
    ranges.push({ start, end });
  });

  let nextDescription = description;
  for (const { start, end } of ranges.sort((a, b) => b.start - a.start)) {
    nextDescription =
      nextDescription.slice(0, start) + nextDescription.slice(end);
  }

  return {
    nextDescription,
    hasImageReferences: ranges.length > 0 || hasUnsupportedReferences,
    hasUnsupportedReferences,
  };
};
