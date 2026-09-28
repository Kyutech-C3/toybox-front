import { visit } from "unist-util-visit";

import type { Root, RootContent, Text } from "mdast";

// 段落内の通常の改行を、明示的な改行と同じ br に変換する。
const remarkSoftBreaks = () => (tree: Root) => {
  visit(tree, "text", (node, index, parent) => {
    if (index === undefined || !parent || !node.value.includes("\n")) return;

    const parts = node.value.split("\n");
    const children: RootContent[] = [];
    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const part = parts[partIndex];
      if (partIndex > 0) children.push({ type: "break" });
      if (part) children.push({ type: "text", value: part } satisfies Text);
    }
    parent.children.splice(index, 1, ...children);
  });
};

export default remarkSoftBreaks;
