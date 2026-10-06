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

export const WideTable: Story = {
  args: {
    content:
      "| 長い見出しの一列目 | 長い見出しの二列目 | 長い見出しの三列目 | 長い見出しの四列目 |\n| --- | --- | --- | --- |\n| 内容一 | 内容二 | 内容三 | 内容四 |",
  },
};

export const Empty: Story = { args: { content: "" } };

export const LongUnbrokenText: Story = {
  args: { content: "a".repeat(2000) },
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector("p");
    if (!(paragraph?.parentElement instanceof HTMLElement))
      throw new Error("プレビューが見つかりません");
    await expect(paragraph.parentElement.scrollWidth).toBeLessThanOrEqual(
      paragraph.parentElement.clientWidth,
    );
  },
};

export const LinksAndLineBreaks: Story = {
  args: {
    content:
      "普通の改行\n続き\n\n行末に空白を入れる  \n明示的な改行\n\nhttps://example.com www.example.com a@example.com\n\n[外部](https://example.com) <https://example.com> [内部](/works) [ページ内](#section)",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const paragraphs = canvasElement.querySelectorAll("p");
    await expect(paragraphs[0].querySelectorAll("br")).toHaveLength(1);
    await expect(paragraphs[1].querySelector("br")).not.toBeNull();
    await expect(paragraphs[2].textContent).toBe(
      "https://example.com www.example.com a@example.com",
    );
    const rawLinks = paragraphs[2].querySelectorAll("a");
    await expect(rawLinks).toHaveLength(3);
    await expect(rawLinks[0]).toHaveAttribute("href", "https://example.com");
    await expect(rawLinks[0]).toHaveAttribute("target", "_blank");
    await expect(rawLinks[1]).toHaveAttribute("target", "_blank");
    await expect(rawLinks[2]).toHaveAttribute("href", "mailto:a@example.com");
    for (const name of ["外部", "https://example.com"]) {
      for (const link of canvas.getAllByRole("link", { name })) {
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    }
    for (const name of ["内部", "ページ内"]) {
      await expect(canvas.getByRole("link", { name })).not.toHaveAttribute(
        "target",
        "_blank",
      );
    }
  },
};

export const ParagraphSpacing: Story = {
  args: {
    content: "段落を分けるには、間に空行を入れます。 &#x20;\n\n次の段落です。",
  },
  play: async ({ canvasElement }) => {
    const paragraphs = canvasElement.querySelectorAll("p");
    await expect(paragraphs).toHaveLength(2);
    await expect(
      paragraphs[1].getBoundingClientRect().top -
        paragraphs[0].getBoundingClientRect().bottom,
    ).toBeGreaterThan(8);
  },
};

export const ImageFullscreen: Story = {
  args: {
    content:
      "![拡大する画像](/toyboxtech.drawio.png)\n\n[![リンク付き画像](/favicon-192.png)](https://example.com)",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const imageButton = canvas.getByRole("button", {
      name: "拡大する画像を全画面表示",
    });
    const paragraph = imageButton.closest("p");
    if (!paragraph) throw new Error("画像の段落が見つかりません");
    await expect(imageButton.getBoundingClientRect().left).toBeCloseTo(
      paragraph.getBoundingClientRect().left,
      0,
    );
    await expect(canvasElement.querySelector("a button")).toBeNull();
    await expect(
      canvas.getByRole("link", { name: "リンク付き画像" }),
    ).toHaveAttribute("href", "https://example.com");
    const previousOverflow = document.body.style.overflow;
    await userEvent.click(imageButton);
    const dialog = canvas.getByRole("dialog", { name: "画像の全画面表示" });
    await expect(dialog).toBeVisible();
    await expect(document.body.style.overflow).toBe("hidden");
    await expect(getComputedStyle(dialog).backgroundColor).toBe(
      "rgba(0, 0, 0, 0.3)",
    );
    const fullscreenImage = within(dialog).getByAltText("拡大する画像");
    if (!(fullscreenImage instanceof HTMLImageElement))
      throw new Error("全画面画像が見つかりません");
    await expect(fullscreenImage).toHaveAttribute(
      "src",
      "/toyboxtech.drawio.png",
    );
    await waitFor(() =>
      expect(fullscreenImage.naturalWidth).toBeGreaterThan(0),
    );
    const viewport = fullscreenImage.parentElement;
    if (!viewport) throw new Error("画像の表示領域が見つかりません");
    await expect(document.fullscreenElement).toBeNull();
    await expect(getComputedStyle(fullscreenImage).objectFit).toBe("contain");
    await expect(fullscreenImage.clientWidth).toBe(viewport.clientWidth);
    await expect(fullscreenImage.clientHeight).toBe(viewport.clientHeight);
    const bounds = dialog.getBoundingClientRect();
    viewport.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 1000,
      }),
    );
    await expect(fullscreenImage.style.transform).toContain(
      "translate3d(0px, 0px, 0px)",
    );
    const zoom = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -800,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    });
    viewport.dispatchEvent(zoom);
    await expect(zoom.defaultPrevented).toBe(true);
    await waitFor(() =>
      expect(fullscreenImage.style.transform).not.toContain("scale(1)"),
    );
    const pan = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      shiftKey: true,
      deltaY: 80,
    });
    viewport.dispatchEvent(pan);
    await expect(pan.defaultPrevented).toBe(true);
    await waitFor(() =>
      expect(fullscreenImage.style.transform).toContain("-80px"),
    );
    viewport.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
        deltaY: 100000,
      }),
    );
    await waitFor(() =>
      expect(fullscreenImage.style.transform).not.toContain("-80px"),
    );
    await waitFor(() =>
      expect(
        fullscreenImage.getBoundingClientRect().bottom,
      ).toBeGreaterThanOrEqual(bounds.bottom - 1),
    );
    viewport.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
        deltaY: -100000,
      }),
    );
    await waitFor(() =>
      expect(fullscreenImage.getBoundingClientRect().top).toBeLessThanOrEqual(
        bounds.top + 1,
      ),
    );
    await expect(dialog.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      window.innerWidth - 1,
    );
    await expect(
      within(dialog).queryByRole("button", { name: /次の画像|前の画像/ }),
    ).toBeNull();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "全画面表示を閉じる" }),
    );
    await expect(dialog).not.toBeVisible();
    await waitFor(() =>
      expect(document.body.style.overflow).toBe(previousOverflow),
    );
    await userEvent.click(imageButton);
    await expect(dialog).toBeVisible();
    await expect(
      within(dialog).getByAltText("拡大する画像").style.transform,
    ).toBe("translate3d(0px, 0px, 0px) scale(1)");
    await userEvent.keyboard("{Escape}");
    await expect(dialog).not.toBeVisible();
    await expect(imageButton).toHaveFocus();
  },
};

export const ImageFullscreenKeyboard: Story = {
  args: { content: "![キーボードで拡大](/favicon-192.png)" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const imageButton = canvas.getByRole("button", {
      name: "キーボードで拡大を全画面表示",
    });
    imageButton.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = canvas.getByRole("dialog", { name: "画像の全画面表示" });
    await expect(dialog).toBeVisible();
    const image = within(dialog).getByAltText("キーボードで拡大");
    if (!(image instanceof HTMLImageElement) || !image.parentElement)
      throw new Error("画像の表示領域が見つかりません");
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
    await expect(image.clientWidth).toBe(image.parentElement.clientWidth);
    await expect(image.clientHeight).toBe(image.parentElement.clientHeight);
    await userEvent.keyboard("{Escape}");
    await expect(dialog).not.toBeVisible();
  },
};

export const ImageLineSpacing: Story = {
  args: {
    content:
      "![一枚目](/favicon-192.png)\n![二枚目](/favicon-192.png)\n次の文字",
  },
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("p > button");
    await expect(buttons).toHaveLength(2);
    const image = buttons[0].querySelector("img");
    if (!image) throw new Error("画像が見つかりません");
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
    const imageGap =
      buttons[1].getBoundingClientRect().top -
      buttons[0].getBoundingClientRect().bottom;
    await expect(imageGap).toBeGreaterThanOrEqual(12);
    await expect(imageGap).toBeLessThan(20);

    const paragraph = buttons[1].parentElement;
    const text = paragraph?.lastChild;
    if (!text || text.nodeType !== Node.TEXT_NODE)
      throw new Error("画像の次の文字が見つかりません");
    const range = document.createRange();
    range.selectNodeContents(text);
    const textGap =
      range.getBoundingClientRect().top -
      buttons[1].getBoundingClientRect().bottom;
    await expect(textGap).toBeGreaterThanOrEqual(6);
    await expect(textGap).toBeLessThan(20);
  },
};

export const MarkdownSyntaxSample: Story = {
  args: { content: markdownSyntaxSample },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Markdown チートシート" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: "収録項目" }),
    ).toBeInTheDocument();
    const heading = canvas.getByRole("heading", {
      name: "入れ子を組み合わせた複雑な例",
    });
    await expect(heading.id).toBe(
      "user-content-markdown-heading-入れ子を組み合わせた複雑な例",
    );
    await expect(heading.lastElementChild).toHaveAttribute(
      "href",
      `#${encodeURIComponent("入れ子を組み合わせた複雑な例")}`,
    );
    const duplicateHeadings = canvas.getAllByRole("heading", {
      name: "重複見出しの例",
    });
    await expect(duplicateHeadings).toHaveLength(2);
    await expect(duplicateHeadings[1].id).toBe(`${duplicateHeadings[0].id}-1`);
    await expect(
      heading.firstElementChild?.getBoundingClientRect().left,
    ).toBeCloseTo(heading.getBoundingClientRect().left);
    const italic = canvas.getByText("アスタリスク1個による斜体");
    await expect(italic.tagName).toBe("EM");
    await expect(getComputedStyle(italic).fontStyle).toBe("italic");
    await expect(getComputedStyle(italic).fontSynthesis).toBe("style");
    const underline = canvas.getByText("下線を付けたい文字");
    const highlight = canvas.getByText("注目してほしい文字");
    const subscript = canvas.getByText("2", { selector: "sub" });
    const superscript = canvas.getByText("10", { selector: "sup" });
    await expect(underline.tagName).toBe("U");
    await expect(highlight.tagName).toBe("MARK");
    await expect(subscript.tagName).toBe("SUB");
    await expect(superscript.tagName).toBe("SUP");
    await expect(
      canvas.getByText("波線 1 個でも取り消し線", { selector: "del" }),
    ).toBeVisible();
    await expect(getComputedStyle(highlight).color).toBe(
      getComputedStyle(canvasElement).color,
    );
    const inlineMath = canvasElement.querySelector("p .katex");
    const displayMath = canvasElement.querySelector(".katex-display .katex");
    await expect(canvasElement.querySelectorAll(".katex")).toHaveLength(5);
    await expect(inlineMath).not.toBeNull();
    await expect(displayMath).not.toBeNull();
    await expect(
      inlineMath?.querySelector(".katex-mathml math"),
    ).not.toBeNull();
    await expect(
      displayMath?.querySelector(".katex-mathml math"),
    ).not.toBeNull();
    await expect(canvasElement.querySelector(".katex-error")).toBeNull();
    await expect(
      canvasElement.querySelector(
        "script, iframe, dl, font, video, audio, kbd, ruby",
      ),
    ).toBeNull();
    const securityDetails = canvas
      .getByText("属性を除去する折りたたみ", { selector: "summary" })
      .closest("details");
    await expect(securityDetails).toHaveAttribute("open");
    await expect(securityDetails).not.toHaveAttribute("ontoggle");
    await expect(securityDetails).not.toHaveAttribute("style");
    await expect(securityDetails?.querySelector("summary")).not.toHaveAttribute(
      "onclick",
    );
    for (const name of ["危険なスキームのリンク", "HTML の危険なリンク"]) {
      await expect(
        canvas.getByText(name, { selector: "a" }),
      ).not.toHaveAttribute("href");
    }
    for (const example of [
      { name: "サイズ指定の確認用画像", width: "40" },
      { name: "width 属性の確認用画像", width: "80" },
      { name: "style 属性の確認用画像", width: "60" },
    ]) {
      const image = canvas.getByAltText(example.name);
      await expect(image).toHaveAttribute("width", example.width);
      await expect(image).toHaveStyle({ width: `${example.width}px` });
      await expect(getComputedStyle(image).width).toBe(`${example.width}px`);
    }
    for (const name of ["幅が上限を超える画像", "幅と色を一緒に指定した画像"]) {
      const image = canvas.getByAltText(name);
      await expect(image).not.toHaveAttribute("width");
      await expect(image).not.toHaveAttribute("style");
    }
    await expect(
      Reflect.get(window, "__toyboxMarkdownSampleExecuted"),
    ).toBeUndefined();
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
    const headingLink = canvas.getAllByRole("link", {
      name: "「概要」へのリンクをコピー",
    })[0];
    await expect(headings[0].lastElementChild).toBe(headingLink);
    await expect(headingLink.getBoundingClientRect().left).toBeGreaterThan(
      headings[0].firstElementChild?.getBoundingClientRect().right ?? 0,
    );
    const icon = headingLink.querySelector("svg");
    if (icon && window.matchMedia("(hover: hover)").matches) {
      await expect(getComputedStyle(icon).opacity).toBe("0");
      headingLink.focus();
      await expect(getComputedStyle(icon).opacity).toBe("1");
      headingLink.blur();
    }
    const originalURL = window.location.href;
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
      window.history.replaceState(null, "", originalURL);
    }
    await expect(
      canvas.getByRole("link", { name: "最初の概要" }),
    ).toHaveAttribute("href", `#${encodeURIComponent("概要")}`);
    await expect(
      canvas.getByRole("link", { name: "次の概要" }),
    ).toHaveAttribute("href", `#${encodeURIComponent("概要-1")}`);
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
      'インラインの `plain`\n\n```ts:src/main.ts\nconst message = "Toybox";\n```\n\n```\n  言語なし\n次の行\n```\n\n    インデント形式\n\n```unknown-language:example.txt\nunknown code\n```\n\n```ts\nconst value = 1;\n```',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("src/main.ts")).toBeVisible();
    await expect(canvas.getByText("example.txt")).toBeVisible();
    const buttons = canvas.getAllByRole("button", { name: "コードをコピー" });
    await expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      const surface =
        button.previousElementSibling ?? button.nextElementSibling;
      if (!(surface instanceof HTMLElement))
        throw new Error("コード枠またはファイル名が見つかりません");
      const surfaceBounds = surface.getBoundingClientRect();
      const buttonBounds = button.getBoundingClientRect();
      await expect(buttonBounds.top - surfaceBounds.top).toBeGreaterThanOrEqual(
        8,
      );
      await expect(
        surfaceBounds.bottom - buttonBounds.bottom,
      ).toBeGreaterThanOrEqual(8);
      await expect(
        surfaceBounds.right - buttonBounds.right,
      ).toBeGreaterThanOrEqual(8);
      await expect(buttonBounds.height).toBeCloseTo(
        Number.parseFloat(getComputedStyle(surface).lineHeight),
        0,
      );
    }
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      for (const example of [
        'const message = "Toybox";',
        "  言語なし\n次の行",
        "インデント形式",
        "unknown code",
        "const value = 1;",
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
