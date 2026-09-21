import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import MarkdownPreview from "./index";

import { render } from "@/test/render";

describe("Markdown表示", () => {
  it("GFMの表・取り消し線・改行・リンクを表示", async () => {
    const { container } = await render(
      <MarkdownPreview
        content={
          "## 見出し\n\n| 名前 | 値 |\n| --- | --- |\n| 項目 | 1 |\n\n~~削除~~\n次の行\n\n[外部](https://example.com)"
        }
      />,
    );
    await expect
      .element(page.getByRole("heading", { name: "見出し" }))
      .toBeVisible();
    await expect.element(page.getByRole("table")).toBeVisible();
    expect(container.querySelector("del")?.textContent).toBe("削除");
    expect(container.querySelector("br")).not.toBeNull();
    await expect
      .element(page.getByRole("link", { name: "外部" }))
      .toHaveAttribute("href", "https://example.com");
  });
  it("raw HTMLを実行せず危険なリンクを無効化", async () => {
    const { container } = await render(
      <MarkdownPreview
        content={
          "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[危険](javascript:alert%281%29)\n\n`<b>コード</b>`"
        }
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    const link = page.getByRole("link", { name: "危険" });
    await expect
      .element(link)
      .not.toHaveAttribute("href", expect.stringContaining("javascript:"));
    expect(container.querySelector("code")?.textContent).toBe("<b>コード</b>");
  });
  it("言語付きコードを表示し、元のテキストをコピーする", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText,
    } as unknown as Clipboard);
    await render(
      <MarkdownPreview content={"```typescript\nconst answer = 42;\n```"} />,
    );
    await page.getByRole("button", { name: "コードをコピー" }).click();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("const answer = 42;");
  });
});
