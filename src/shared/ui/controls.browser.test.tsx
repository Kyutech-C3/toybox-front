import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import Listbox from "./Listbox";
import { Pagination } from "./Pagination";
import TagInput from "./TagInput";

import { render } from "@/test/render";

const ListboxHarness = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("b");
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        選択
      </button>
      <output>{value}</output>
      <button type="button">外側</button>
      <Listbox
        id="test-listbox"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        selectedValue={value}
        onSelect={setValue}
        ariaLabel="候補"
        options={[
          { id: "a", value: "a", label: "項目A" },
          { id: "b", value: "b", label: "項目B" },
          { id: "c", value: "c", label: "項目C" },
        ]}
      />
    </>
  );
};

describe("共通操作UI", () => {
  it("選択済み項目へのfocus、矢印循環、Home/End、Enter選択とfocus復帰", async () => {
    await render(<ListboxHarness />);
    const trigger = page.getByRole("button", { name: "選択", exact: true });
    await trigger.click();
    await expect
      .element(page.getByRole("option", { name: "項目B" }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect
      .element(page.getByRole("option", { name: "項目A" }))
      .toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect
      .element(page.getByRole("option", { name: "項目C" }))
      .toHaveFocus();
    await userEvent.keyboard("{Home}{Enter}");
    await expect.element(page.getByRole("status")).toHaveTextContent("a");
    await expect.element(trigger).toHaveFocus();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });
  it("Escapeと外側クリックで閉じる", async () => {
    await render(<ListboxHarness />);
    const trigger = page.getByRole("button", { name: "選択", exact: true });
    await trigger.click();
    await userEvent.keyboard("{Escape}");
    await expect.element(trigger).toHaveFocus();
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
    await trigger.click();
    await page.getByRole("button", { name: "外側" }).click();
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
  });
  it.each([1, 5, 10])(
    "ページ境界 %i で重複せず正しいページを通知",
    async (currentPage) => {
      const onPageChange = vi.fn();
      await render(
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={onPageChange}
        />,
      );
      const target = page.getByRole("button", {
        name: `ページ ${currentPage}`,
        exact: true,
      });
      await expect.element(target).toBeVisible();
      await target.click();
      expect(onPageChange).toHaveBeenCalledExactlyOnceWith(currentPage);
      await expect
        .element(page.getByRole("button", { name: "ページ 1", exact: true }))
        .toBeVisible();
      await expect
        .element(page.getByRole("button", { name: "ページ 10", exact: true }))
        .toBeVisible();
    },
  );
  it("省略ページから選択できる", async () => {
    const onPageChange = vi.fn();
    await render(
      <div style={{ paddingTop: 300 }}>
        <Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={onPageChange}
        />
      </div>,
    );
    await page.getByRole("button", { name: "隠れたページを表示" }).click();
    await page.getByRole("option", { name: "7", exact: true }).click();
    expect(onPageChange).toHaveBeenCalledWith(7);
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
  });
  it("タグは空白と重複を除きIDで削除する", async () => {
    const onAddTag = vi.fn();
    const onRemoveTag = vi.fn();
    await render(
      <TagInput
        aria-label="タグ"
        tags={[{ id: "react-id", name: "React" }]}
        allTagOptions={["React", "TypeScript", "JavaScript"]}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />,
    );
    const input = page.getByRole("combobox", { name: "タグ" });
    await input.fill("react");
    await userEvent.keyboard("{Enter}");
    expect(onAddTag).not.toHaveBeenCalled();
    await input.fill("  新規  ");
    await userEvent.keyboard("{Enter}");
    expect(onAddTag).toHaveBeenCalledWith("新規");
    await input.fill("script");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onAddTag).toHaveBeenCalledWith("TypeScript");
    await page.getByRole("button", { name: "Remove React batch" }).click();
    expect(onRemoveTag).toHaveBeenCalledWith("react-id");
  });
});
