import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import type { Root, RootContent } from "mdast";

const MARKDOWN_PARSER = unified().use(remarkParse).use(remarkGfm);

const getNodeText = (node: Root | RootContent): string => {
  if (node.type === "definition" || node.type === "footnoteDefinition") {
    return "";
  }
  if (node.type === "html") {
    const template = document.createElement("template");
    template.innerHTML = node.value;
    for (const element of template.content.querySelectorAll(
      "script, style, template",
    )) {
      element.remove();
    }
    return template.content.textContent ?? "";
  }
  if (node.type === "break") return " ";
  if ("value" in node) return node.value;
  if ("alt" in node) return node.alt ?? "";
  if ("children" in node) {
    const separator =
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "link" ||
      node.type === "linkReference" ||
      node.type === "strong" ||
      node.type === "emphasis" ||
      node.type === "delete"
        ? ""
        : " ";
    return node.children.map(getNodeText).join(separator);
  }
  return "";
};

export const getMarkdownText = (markdown: string): string =>
  getNodeText(MARKDOWN_PARSER.parse(markdown)).replace(/\s+/g, " ").trim();
