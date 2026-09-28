import { visit } from "unist-util-visit";

import type { Root } from "mdast";

// GFM が自動生成したリンクだけをテキストに戻す。明示的なリンク記法は位置に記号を含む。
const remarkPlainUrls = () => (tree: Root) => {
  visit(tree, "link", (node, index, parent) => {
    const text = node.children[0];
    if (
      index === undefined ||
      !parent ||
      node.children.length !== 1 ||
      text?.type !== "text" ||
      node.position?.start.offset === undefined ||
      node.position.end.offset === undefined ||
      text.position?.start.offset !== node.position.start.offset ||
      text.position.end.offset !== node.position.end.offset
    )
      return;

    parent.children[index] = text;
  });
};

export default remarkPlainUrls;
