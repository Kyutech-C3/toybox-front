import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { Root } from "mdast";

type AssetMarkdownAnalysis = {
  nextDescription: string;
  hasAssetReferences: boolean;
  hasUnsupportedReferences: boolean;
};

const MARKDOWN_PARSER = unified().use(remarkParse).use(remarkGfm);
const ASSET_REFERENCE_SELECTOR = "img, video, audio, source";

const matchesAssetURL = (candidate: string, assetURL: string) =>
  candidate === assetURL ||
  candidate === assetURL.replaceAll("(", "%28").replaceAll(")", "%29");

export const getReferencedAssetURLs = (
  description: string,
  assetURLs: string[],
): Set<string> => {
  const referencedURLs = new Set<string>();
  if (assetURLs.length === 0) return referencedURLs;

  const candidates = new Map<string, Set<string>>();
  for (const assetURL of assetURLs) {
    for (const candidate of [
      assetURL,
      assetURL.replaceAll("(", "%28").replaceAll(")", "%29"),
    ]) {
      const matchingURLs = candidates.get(candidate) ?? new Set<string>();
      matchingURLs.add(assetURL);
      candidates.set(candidate, matchingURLs);
    }
  }

  const addReference = (candidate: string) => {
    for (const assetURL of candidates.get(candidate) ?? []) {
      referencedURLs.add(assetURL);
    }
  };

  const tree = MARKDOWN_PARSER.parse(description) as Root;
  const definitions = new Map<string, string>();
  visit(tree, "definition", (node) => {
    definitions.set(node.identifier, node.url);
  });
  visit(tree, (node) => {
    if (node.type === "image" || node.type === "imageReference") {
      const url =
        node.type === "image" ? node.url : definitions.get(node.identifier);
      if (url) addReference(url);
    } else if (node.type === "html" && typeof document !== "undefined") {
      const template = document.createElement("template");
      template.innerHTML = node.value;
      for (const media of template.content.querySelectorAll(
        ASSET_REFERENCE_SELECTOR,
      )) {
        addReference(media.getAttribute("src") ?? "");
      }
      for (const video of template.content.querySelectorAll("video[poster]"))
        addReference(video.getAttribute("poster") ?? "");
    }
  });

  return referencedURLs;
};

export const removeAssetMarkdown = (
  description: string,
  assetURL: string,
): AssetMarkdownAnalysis => {
  const tree = MARKDOWN_PARSER.parse(description) as Root;
  const definitions = new Map<string, string>();
  const ranges: { start: number; end: number }[] = [];
  let hasUnsupportedReferences = false;

  visit(tree, "definition", (node) => {
    definitions.set(node.identifier, node.url);
  });

  visit(tree, (node, index, parent) => {
    let referenceEnd: number | undefined;
    if (node.type === "image") {
      if (!matchesAssetURL(node.url, assetURL)) return;
    } else if (node.type === "imageReference") {
      const url = definitions.get(node.identifier);
      if (!url || !matchesAssetURL(url, assetURL)) return;
    } else if (node.type === "html") {
      if (typeof document === "undefined") return;
      const template = document.createElement("template");
      template.innerHTML = node.value;
      const hasMatchingAsset = Array.from(
        template.content.querySelectorAll(ASSET_REFERENCE_SELECTOR),
      ).some((media) =>
        matchesAssetURL(media.getAttribute("src") ?? "", assetURL),
      );
      const hasMatchingPoster = Array.from(
        template.content.querySelectorAll("video[poster]"),
      ).some((video) =>
        matchesAssetURL(video.getAttribute("poster") ?? "", assetURL),
      );
      if (!hasMatchingAsset && !hasMatchingPoster) return;
      // 複数要素を含む HTML は、周囲の内容を巻き込まないよう手動編集を促す。
      const isSingleImage = /^<img\b[^>]*\/?>\s*$/is.test(node.value);
      // CommonMark は video/audio の開始・終了タグを別々の HTML ノードにする。
      // 直後の空要素の終了タグまでを一緒に削除し、周囲の文章は残す。
      const following =
        index === undefined ? undefined : parent?.children[index + 1];
      const openingMedia = /^<(video|audio)\b[^>]*>$/is.exec(node.value);
      const hasAdjacentClosingTag =
        openingMedia &&
        following?.type === "html" &&
        following.value.toLowerCase() ===
          `</${openingMedia[1].toLowerCase()}>` &&
        node.position?.end.offset === following.position?.start.offset;
      if (hasAdjacentClosingTag) referenceEnd = following.position?.end.offset;
      const isSingleMedia =
        hasAdjacentClosingTag ||
        /^<(video|audio)\b[^>]*>\s*<\/\1>\s*$/is.test(node.value);
      if (hasMatchingPoster || (!isSingleImage && !isSingleMedia)) {
        hasUnsupportedReferences = true;
        return;
      }
    } else {
      return;
    }

    const start = node.position?.start.offset;
    const end = referenceEnd ?? node.position?.end.offset;
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
    hasAssetReferences: ranges.length > 0 || hasUnsupportedReferences,
    hasUnsupportedReferences,
  };
};
