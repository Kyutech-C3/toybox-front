import { expect, spyOn, userEvent, within } from "storybook/test";

import MarkdownPreview from "./index";

import markdownSyntaxSample from "@/stories/markdownSyntaxSample.md?raw";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/MarkdownPreview",
  component: MarkdownPreview,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: "min(760px, 90vw)" }}>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownPreview>;

export default META;
type Story = StoryObj<typeof META>;

export const RichContent: Story = {
  args: {
    content:
      '# 作品説明\n\n**太字**、[リンク](https://example.com)、リストを表示します。\n\n- React\n- TypeScript\n\n```ts\nconst message = "Toybox";\n```',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "作品説明" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "コードをコピー" }),
    );
  },
};

export const TableAndTaskList: Story = {
  args: {
    content:
      "| 項目 | 状態 |\n| --- | --- |\n| Storybook | 完了 |\n\n- [x] UI確認\n- [ ] 実機確認",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("checkbox", { name: "UI確認" }),
    ).toBeChecked();
    await expect(
      canvas.getByRole("checkbox", { name: "実機確認" }),
    ).not.toBeChecked();
  },
};

export const Empty: Story = { args: { content: "" } };

export const MarkdownSyntaxSample: Story = {
  args: { content: markdownSyntaxSample },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Markdown 記法テストドキュメント" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: "最後の確認" }),
    ).toBeInTheDocument();
  },
};

export const DarkMarkdownSyntaxSample: Story = {
  ...MarkdownSyntaxSample,
  globals: { theme: "dark" },
  parameters: { docs: { story: { inline: false } } },
};

export const HeadingLinksAndFootnotes: Story = {
  args: {
    content:
      "## 概要\n\n[最初の概要](#概要) / [次の概要](#概要-1)\n\n本文[^note] と再参照[^note]\n\n## 概要\n\n次の内容\n\n## [公式サイト](https://example.com)\n\n[^note]: 脚注の内容",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headings = canvas.getAllByRole("heading", { name: "概要" });
    await expect(canvasElement.querySelector("a a")).toBeNull();
    await expect(
      canvas.getByRole("link", { name: "公式サイト" }),
    ).toHaveAttribute("href", "https://example.com");
    await expect(headings[0].id).not.toBe(headings[1].id);
    await expect(
      canvas.getByRole("link", { name: "最初の概要" }),
    ).toHaveAttribute("href", `#${encodeURIComponent(headings[0].id)}`);
    await expect(
      canvas.getByRole("link", { name: "次の概要" }),
    ).toHaveAttribute("href", `#${encodeURIComponent(headings[1].id)}`);
    for (const reference of canvasElement.querySelectorAll<HTMLAnchorElement>(
      "[data-footnote-ref]",
    )) {
      const target = document.getElementById(
        decodeURIComponent(reference.hash.slice(1)),
      );
      await expect(target).not.toBeNull();
      await expect(target?.textContent).toContain("脚注の内容");
      await expect(
        document.getElementById(
          reference.getAttribute("aria-describedby") ?? "",
        ),
      ).not.toBeNull();
    }
    for (const backref of canvasElement.querySelectorAll<HTMLAnchorElement>(
      "[data-footnote-backref]",
    )) {
      await expect(
        document.getElementById(decodeURIComponent(backref.hash.slice(1))),
      ).toHaveAttribute("data-footnote-ref");
    }
    // Vitest の実行用 iframe からの遷移は抑え、リンク先を検証する。
    const link = canvas.getByRole("link", { name: "次の概要" });
    link.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    await userEvent.click(link);
  },
};

export const AlertsAndDetails: Story = {
  args: {
    content:
      "> [!NOTE]\n> 補足の内容\n\n> [!TIP]\n> ヒントの内容\n\n> [!IMPORTANT]\n> 重要な内容\n\n> [!WARNING]\n> 警告の内容\n\n> [!CAUTION]\n> 注意の内容\n\n> 通常の引用\n\n[詳細の見出しへ](#詳細の見出し)\n\n<details><summary>詳しい説明</summary>\n\n## 詳細の見出し\n\n**折りたたみの本文**\n\n<details><summary>さらに詳しい説明</summary>\n\n入れ子の補足\n\n</details>\n\n</details>\n\n<details open><summary>最初から表示</summary>\n\n開いた補足\n\n</details>",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelectorAll("[data-markdown-alert]"),
    ).toHaveLength(5);
    for (const label of ["補足", "ヒント", "重要", "警告", "注意"]) {
      await expect(canvas.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(
      canvas.getByText("通常の引用").closest("blockquote"),
    ).not.toHaveAttribute("data-markdown-alert");
    const summary = canvas.getByText("詳しい説明", { selector: "summary" });
    const details = summary.closest("details");
    await expect(details).not.toHaveAttribute("open");
    await userEvent.click(summary);
    await expect(canvas.getByText("折りたたみの本文")).toBeVisible();
    await userEvent.click(summary);
    await expect(details).not.toHaveAttribute("open");
    const detailLink = canvas.getByRole("link", { name: "詳細の見出しへ" });
    detailLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    await userEvent.click(detailLink);
    await expect(details).toHaveAttribute("open");
    await expect(
      canvas.getByRole("heading", { name: "詳細の見出し" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByText("さらに詳しい説明", { selector: "summary" }),
    );
    await expect(canvas.getByText("入れ子の補足")).toBeVisible();
    await expect(canvas.getByText("開いた補足")).toBeVisible();
  },
};

export const CodeFilesAndCopy: Story = {
  args: {
    content:
      'インラインの `plain`\n\n```ts:src/main.ts\nconst message = "Toybox";\n```\n\n```\n  言語なし\n次の行\n```\n\n    インデント形式\n\n```unknown-language:example.txt\nunknown code\n```',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("src/main.ts")).toBeVisible();
    await expect(canvas.getByText("example.txt")).toBeVisible();
    const buttons = canvas.getAllByRole("button", { name: "コードをコピー" });
    await expect(buttons).toHaveLength(4);
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      for (const example of [
        'const message = "Toybox";',
        "  言語なし\n次の行",
        "インデント形式",
        "unknown code",
      ].entries()) {
        await userEvent.click(buttons[example[0]]);
        await expect(copy).toHaveBeenLastCalledWith(example[1]);
      }
    } finally {
      copy.mockRestore();
    }
  },
};

export const SanitizedHtml: Story = {
  args: {
    content:
      '<details open ontoggle="alert(1)" style="color:red"><summary onclick="alert(1)">安全な折りたたみ</summary>\n\n本文\n\n<script>window.markdownInjected = true</script>\n<style>body { display: none }</style>\n<iframe src="https://example.com"></iframe>\n<svg onload="alert(1)"></svg>\n\n[危険なリンク](javascript:alert%281%29)\n\n<a id="current" href="javascript:alert(1)" onmouseover="alert(1)">HTML リンク</a>\n\n</details>',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("安全な折りたたみ")).toBeVisible();
    await expect(
      canvasElement
        .querySelector("details")
        ?.querySelector(
          "script, style, iframe, svg, [onclick], [ontoggle], [onmouseover], [style]",
        ),
    ).toBeNull();
    await expect(canvasElement.querySelector("details")).not.toHaveAttribute(
      "style",
    );
    await expect(canvasElement.querySelector("details")).not.toHaveAttribute(
      "ontoggle",
    );
    await expect(canvas.getByText("危険なリンク")).not.toHaveAttribute(
      "href",
      expect.stringMatching(/^javascript:/i),
    );
    await expect(canvas.getByText("HTML リンク")).toHaveAttribute(
      "id",
      "user-content-current",
    );
    await expect(canvasElement.querySelector("#current")).toBeNull();
  },
};
