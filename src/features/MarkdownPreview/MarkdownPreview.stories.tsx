import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";

import MarkdownPreview from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import markdownSyntaxSample from "@/stories/markdownSyntaxSample.md?raw";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/MarkdownPreview",
  component: MarkdownPreview,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: "min(760px, 90vw)" }}>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownPreview>;

export default META;
type Story = StoryObj<typeof META>;

export const WideTable: Story = {
  args: {
    content:
      "| 長い見出しの一列目 | 長い見出しの二列目 | 長い見出しの三列目 | 長い見出しの四列目 |\n| --- | --- | --- | --- |\n| 内容一 | 内容二 | 内容三 | 内容四 |",
  },
};

export const Empty: Story = { args: { content: "" } };

export const ImageFullscreen: Story = {
  tags: ["test"],
  args: {
    content:
      "![拡大する画像](/toyboxtech.drawio.png)\n\n[![リンク付き画像](/favicon-192.png)](https://example.com)",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const imageButton = canvas.getByRole("button", {
      name: "拡大する画像を全画面表示",
    });
    const previousOverflow = document.body.style.overflow;
    imageButton.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = canvas.getByRole("dialog", { name: "画像の全画面表示" });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByAltText("拡大する画像")).toHaveAttribute(
      "src",
      "/toyboxtech.drawio.png",
    );
    await expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    await expect(dialog).not.toBeVisible();
    await expect(imageButton).toHaveFocus();
    await waitFor(() =>
      expect(document.body.style.overflow).toBe(previousOverflow),
    );
  },
};

export const MarkdownSyntaxSample: Story = {
  args: { content: markdownSyntaxSample },
};

export const DarkMarkdownSyntaxSample: Story = {
  ...MarkdownSyntaxSample,
  globals: { theme: "dark" },
  parameters: { docs: { story: { inline: false } } },
};

export const HeadingLinksAndFootnotes: Story = {
  tags: ["test"],
  args: {
    content:
      "## 概要\n\n[最初の概要](#概要) / [次の概要](#概要-1)\n\n本文[^note] と再参照[^note]\n\n## 概要\n\n次の内容\n\n## [公式サイト](https://example.com)\n\n[^note]: 脚注の内容",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headings = canvas.getAllByRole("heading", { name: "概要" });
    await expect(headings[0].id).not.toBe(headings[1].id);
    const headingLink = canvas.getAllByRole("link", {
      name: "「概要」へのリンクをコピー",
    })[0];
    const originalURL = window.location.href;
    const originalState = window.history.state;
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const legacyCopy = spyOn(document, "execCommand").mockReturnValue(false);
    try {
      await userEvent.click(headingLink);
      await expect(copy).toHaveBeenCalledWith(
        new URL(headingLink.getAttribute("href") ?? "", window.location.href)
          .href,
      );
      await expect(decodeURIComponent(window.location.hash)).toBe("#概要");
      await waitFor(() =>
        expect(canvas.getByText("リンクをコピーしました")).toBeVisible(),
      );
      copy.mockRejectedValue(new Error("Clipboard unavailable"));
      await userEvent.click(headingLink);
      await waitFor(() =>
        expect(
          canvas.getByText("リンクをコピーできませんでした"),
        ).toBeVisible(),
      );
    } finally {
      copy.mockRestore();
      legacyCopy.mockRestore();
      window.history.replaceState(originalState, "", originalURL);
    }
  },
};

export const CodeFilesAndCopy: Story = {
  tags: ["test"],
  args: {
    content:
      'インラインの `plain`\n\n```ts:src/main.ts\nconst message = "Toybox";\n```\n\n```\n  言語なし\n次の行\n```\n\n    インデント形式\n\n```unknown-language:example.txt\nunknown code\n```\n\n```ts\nconst value = 1;\n```',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("src/main.ts")).toBeVisible();
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.click(
        canvas.getAllByRole("button", { name: "コードをコピー" })[0],
      );
      await expect(copy).toHaveBeenCalledWith('const message = "Toybox";');
    } finally {
      copy.mockRestore();
    }
  },
};

export const SanitizedHtml: Story = {
  tags: ["test"],
  args: {
    content:
      '<details open ontoggle="alert(1)" style="color:red"><summary onclick="alert(1)">安全な折りたたみ</summary>\n\n本文\n\n<script>window.markdownInjected = true</script>\n<style>body { display: none }</style>\n<iframe src="https://example.com"></iframe>\n<svg onload="alert(1)"></svg>\n\n<img src="https://example.com/image.png" alt="危険な画像属性" width="3000" style="width:40px;color:red" onerror="alert(1)">\n\n[危険なリンク](javascript:alert%281%29)\n\n<a id="current" href="javascript:alert(1)" onmouseover="alert(1)">HTML リンク</a>\n\n</details>',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("安全な折りたたみ")).toBeVisible();
    await expect(
      canvasElement
        .querySelector("details")
        ?.querySelector(
          "script, style, iframe, svg, [onclick], [ontoggle], [onmouseover], [onerror], [style]",
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
    const image = canvas.getByAltText("危険な画像属性");
    await expect(image).not.toHaveAttribute("width");
    await expect(image).not.toHaveAttribute("style");
  },
};
