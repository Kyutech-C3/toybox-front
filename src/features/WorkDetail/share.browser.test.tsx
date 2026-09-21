import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import ShareButton from "./ShareButton";

import { render, TestProviders } from "@/test/render";

const SHARE_DESCRIPTOR = Object.getOwnPropertyDescriptor(navigator, "share");
afterEach(() => {
  if (SHARE_DESCRIPTOR)
    Object.defineProperty(navigator, "share", SHARE_DESCRIPTOR);
  else Reflect.deleteProperty(navigator, "share");
});

describe("作品共有", () => {
  it("PCでは現在のURLをコピーし結果を表示", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText,
    } as unknown as Clipboard);
    await render(
      <TestProviders>
        <ShareButton title="作品" />
      </TestProviders>,
    );
    await page.getByRole("button", { name: "この作品を共有する" }).click();
    expect(writeText).toHaveBeenCalledWith(location.href);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("リンクをコピーしました");
  });
  it.each(["success", "cancel", "error"])(
    "タッチ端末の共有結果 %s",
    async (result) => {
      const share = vi.fn().mockImplementation(async () => {
        if (result !== "success")
          throw new DOMException(
            "share",
            result === "cancel" ? "AbortError" : "NotAllowedError",
          );
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: share,
      });
      vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
        writeText: vi.fn().mockResolvedValue(undefined),
      } as unknown as Clipboard);
      const originalMatchMedia = window.matchMedia.bind(window);
      vi.spyOn(window, "matchMedia").mockImplementation((query) =>
        query === "(pointer: coarse)"
          ? { ...originalMatchMedia(query), matches: true }
          : originalMatchMedia(query),
      );
      await render(
        <TestProviders>
          <ShareButton title="作品" />
        </TestProviders>,
      );
      await page.getByRole("button", { name: "この作品を共有する" }).click();
      expect(share).toHaveBeenCalledWith({ title: "作品", url: location.href });
      if (result === "error")
        await expect
          .element(page.getByRole("alert"))
          .toHaveTextContent("リンクをコピーしました");
      else expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    },
  );
});
