import { visit } from "unist-util-visit";

import type { Root } from "hast";

const TEXT_COLOR_PATTERN =
  /^(?:#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})|[a-z]+|(?:rgb|hsl)a?\([\d.,%+\-/\s]+\))$/i;

export const MARKDOWN_TEXT_STYLE_PATTERN = new RegExp(
  `^(?:color: ${TEXT_COLOR_PATTERN.source.slice(1, -1)};|font-size: (?:[89](?:\\.\\d+)?|[12]\\d(?:\\.\\d+)?|3[01](?:\\.\\d+)?|32)px;)+$`,
  "i",
);

// sanitize 前に span の装飾を限定する。相対サイズは固定基準で換算し、
// 入れ子の span でもサイズ上限が累積しないようにする。
const rehypeMarkdownStyles = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (node.tagName !== "span" || typeof node.properties.style !== "string")
      return;

    const allowedStyles = new Map<string, string>();
    for (const declaration of node.properties.style.split(";")) {
      const separator = declaration.indexOf(":");
      if (separator < 0) continue;
      const name = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (name === "color" && TEXT_COLOR_PATTERN.test(value)) {
        allowedStyles.set(name, value);
      }
      if (name !== "font-size") continue;
      const match = /^(\d+(?:\.\d+)?|\.\d+)(px|em|rem|%)$/i.exec(value);
      if (!match) continue;
      const unit = match[2].toLowerCase();
      const pixels =
        Number(match[1]) * (unit === "%" ? 0.16 : unit === "px" ? 1 : 16);
      if (!Number.isFinite(pixels)) continue;
      allowedStyles.set(
        name,
        `${Number(Math.min(32, Math.max(8, pixels)).toFixed(2))}px`,
      );
    }
    if (allowedStyles.size) {
      node.properties.style = [...allowedStyles]
        .map(([name, value]) => `${name}: ${value};`)
        .join("");
    } else {
      delete node.properties.style;
    }
  });
};

export default rehypeMarkdownStyles;
