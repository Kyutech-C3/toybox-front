import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";

import LinkInput from "./WorkDetailForm/LinkInput";

import { render } from "@/test/render";

const LinkHarness = () => {
  const [urls, setUrls] = useState<string[]>([]);
  const [hasInvalidUrls, setHasInvalidUrls] = useState(false);
  return (
    <>
      <LinkInput
        urls={urls}
        onChangeUrls={setUrls}
        onValidationChange={setHasInvalidUrls}
      />
      <output aria-label="保存URL">{JSON.stringify(urls)}</output>
      <output aria-label="URL不正">{String(hasInvalidUrls)}</output>
      <button type="button" onClick={() => setUrls(["https://reset.example/"])}>
        初期化
      </button>
    </>
  );
};

describe("リンク編集", () => {
  it("Enter・重複検証・Backspace・追加ボタンで入力欄とfocusを操作", async () => {
    await render(<LinkHarness />);
    const input = page.getByRole("textbox", { name: "リンク 1" });

    await input.fill("  https://example.com/  ");
    await userEvent.keyboard("{Enter}");
    await expect.element(input).toHaveValue("https://example.com/");

    const secondInput = page.getByRole("textbox", { name: "リンク 2" });
    await expect.element(secondInput).toHaveFocus();
    await secondInput.fill("https://example.com/");
    await userEvent.keyboard("{Enter}");
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("このURLは追加済みです");
    await expect
      .element(page.getByRole("textbox", { name: "リンク 3" }))
      .not.toBeInTheDocument();

    await secondInput.clear();
    await userEvent.keyboard("{Backspace}");
    await expect.element(secondInput).not.toBeInTheDocument();
    await expect.element(input).toHaveFocus();

    await page.getByRole("button", { name: "リンク入力欄を追加" }).click();
    await expect
      .element(page.getByRole("textbox", { name: "リンク 2" }))
      .toHaveFocus();
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "example.com",
    "https:example.com",
  ])("絶対HTTP URL以外を保存しない %s", async (url) => {
    await render(<LinkHarness />);
    const input = page.getByRole("textbox", { name: "リンク 1" });
    await input.fill(url);
    await userEvent.keyboard("{Enter}");
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("http または https の絶対URLを入力してください");
    await expect
      .element(page.getByRole("status", { name: "保存URL" }))
      .toHaveTextContent("[]");
    await expect
      .element(page.getByRole("status", { name: "URL不正" }))
      .toHaveTextContent("true");
  });
  it("未確定編集をpayloadから除外し、外部初期化を反映", async () => {
    await render(<LinkHarness />);
    const input = page.getByRole("textbox", { name: "リンク 1" });
    await input.fill("https://example.com/");
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("status", { name: "保存URL" }))
      .toHaveTextContent('["https://example.com/"]');
    await input.fill("invalid");
    await expect
      .element(page.getByRole("status", { name: "保存URL" }))
      .toHaveTextContent("[]");
    await userEvent.keyboard("{Tab}");
    await page.getByRole("button", { name: "初期化" }).click();
    await expect.element(input).toHaveValue("https://reset.example/");
    await expect
      .element(page.getByRole("status", { name: "URL不正" }))
      .toHaveTextContent("false");
  });
  it("5件の上限に達すると入力欄を追加しない", async () => {
    await render(<LinkHarness />);
    for (let index = 1; index <= 5; index++) {
      await page
        .getByRole("textbox", { name: `リンク ${index}` })
        .fill(`https://example.com/${index}`);
      await userEvent.keyboard("{Enter}");
    }
    await expect
      .element(page.getByRole("textbox", { name: "リンク 6" }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "リンク入力欄を追加" }))
      .toBeDisabled();
  });
});
