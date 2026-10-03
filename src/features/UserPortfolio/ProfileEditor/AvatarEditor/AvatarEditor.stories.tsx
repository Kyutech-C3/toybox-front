import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import AvatarEditor from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/UserPortfolio/AvatarEditor",
  component: AvatarEditor,
  args: { avatarURL: "", isDisabled: false },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof AvatarEditor>;
export default META;
type Story = StoryObj<typeof META>;

const openEdit = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "アイコン画像を編集" }),
  );
  await userEvent.click(
    within(canvasElement).getByRole("option", { name: "編集" }),
  );
  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog"),
  );
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
  );
  return dialog;
};

export const LocalPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole("button", { name: "アイコン画像を編集" });
    const preview = edit.parentElement?.parentElement?.getBoundingClientRect();
    const button = edit.getBoundingClientRect();
    if (!preview) throw new Error("No avatar preview");
    await expect(
      Math.abs(
        button.left + button.width / 2 - preview.left - preview.width / 2,
      ),
    ).toBeLessThan(1);
    await expect(
      Math.abs(
        button.top + button.height / 2 - preview.top - preview.height / 2,
      ),
    ).toBeLessThan(1);
    await expect(canvasElement.textContent).toBe("");
    await userEvent.click(edit);
    await expect(
      canvas.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["編集", "写真を選択"]);
    await userEvent.keyboard("{ArrowDown}");
    await expect(
      canvas.getByRole("option", { name: "写真を選択" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(edit).toHaveFocus();
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(edit);
    await userEvent.click(canvasElement.ownerDocument.body);
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();

    const input = canvas.getByLabelText("アイコン画像のファイル選択");
    let selectionCount = 0;
    const handleSelectClick = (event: Event) => {
      event.preventDefault();
      selectionCount += 1;
    };
    input.addEventListener("click", handleSelectClick);
    await userEvent.click(edit);
    await userEvent.click(canvas.getByRole("option", { name: "写真を選択" }));
    input.removeEventListener("click", handleSelectClick);
    await expect(selectionCount).toBe(1);
    await userEvent.upload(input, await createImageFixture(1600, 1200));
    let dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
    );
    await fireEvent.change(dialog.getByRole("slider"), {
      target: { value: "2" },
    });
    const cropper = dialog.getByLabelText("画像の切り抜き位置");
    cropper.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    const sourceImage = cropper.parentElement?.querySelector("img");
    const savedTransform = new DOMMatrix(sourceImage?.style.transform);
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        canvas.getByRole("img", { name: "アイコン画像のプレビュー" }),
      ).toHaveAttribute("src", expect.stringContaining("blob:")),
    );
    const image = canvas.getByRole("img", { name: "アイコン画像のプレビュー" });
    const savedURL = image.getAttribute("src");
    dialog = await openEdit(canvasElement);
    await waitFor(() =>
      expect(
        Number((dialog.getByRole("slider") as HTMLInputElement).value),
      ).toBeCloseTo(2, 1),
    );
    const source = dialog
      .getByLabelText("画像の切り抜き位置")
      .parentElement?.querySelector("img");
    await expect(source?.naturalWidth).toBe(1600);
    await waitFor(() => {
      const restoredTransform = new DOMMatrix(source?.style.transform);
      expect(restoredTransform.m41).toBeCloseTo(savedTransform.m41, 1);
      expect(restoredTransform.m42).toBeCloseTo(savedTransform.m42, 1);
    });
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    await expect(image).toHaveAttribute("src", savedURL);
    await expect(edit).toHaveFocus();
    await expect(canvasElement.textContent).toBe("");
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};

export const SavedAvatar: Story = {
  args: { avatarURL: "/favicon-64x64.png" },
  play: async ({ canvasElement }) => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (resource, init) => {
      if (String(resource) === "/favicon-64x64.png") {
        fetchCount += 1;
        throw new Error("Saved avatar must not be fetched");
      }
      return originalFetch(resource, init);
    };
    try {
      const dialog = await openEdit(canvasElement);
      await expect(fetchCount).toBe(0);
      await expect(
        dialog
          .getByLabelText("画像の切り抜き位置")
          .parentElement?.querySelector("img")?.naturalWidth,
      ).toBe(64);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(
          within(canvasElement).getByRole("img", {
            name: "アイコン画像のプレビュー",
          }),
        ).toHaveAttribute("src", expect.stringContaining("blob:")),
      );
      const image = within(canvasElement).getByRole("img", {
        name: "アイコン画像のプレビュー",
      });
      const response = await fetch(image.getAttribute("src") ?? "");
      const bitmap = await createImageBitmap(await response.blob());
      await expect([bitmap.width, bitmap.height]).toEqual([64, 64]);
      bitmap.close();
      const second = await openEdit(canvasElement);
      await expect(fetchCount).toBe(0);
      await userEvent.click(second.getByRole("button", { name: "キャンセル" }));
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "アイコン画像を編集" }),
    ).toBeDisabled();
    await expect(
      within(canvasElement).queryByRole("listbox"),
    ).not.toBeInTheDocument();
  },
};
