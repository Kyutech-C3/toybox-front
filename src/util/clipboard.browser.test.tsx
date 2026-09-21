import { describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "./copyTextToClipboard";

import { render } from "@/test/render";

describe("クリップボード", () => {
  it("Clipboard APIが使える場合は直接コピー", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText,
    } as unknown as Clipboard);
    await expect(copyTextToClipboard("本文")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("本文");
  });
  it.each([true, false])(
    "Clipboard API失敗時に旧APIを使いfocusとDOMを復元（結果%s）",
    async (canCopy) => {
      vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      } as unknown as Clipboard);
      const exec = vi.spyOn(document, "execCommand").mockReturnValue(canCopy);
      const { container } = await render(<button type="button">戻り先</button>);
      const button = container.querySelector("button");
      button?.focus();
      await expect(copyTextToClipboard("本文")).resolves.toBe(canCopy);
      expect(exec).toHaveBeenCalledWith("copy");
      expect(document.activeElement).toBe(button);
      expect(document.querySelector("textarea")).toBeNull();
    },
  );
  it("旧APIも例外ならfalseを返し一時要素を残さない", async () => {
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue(
      undefined as unknown as Clipboard,
    );
    vi.spyOn(document, "execCommand").mockImplementation(() => {
      throw new Error("denied");
    });
    await expect(copyTextToClipboard("本文")).resolves.toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
