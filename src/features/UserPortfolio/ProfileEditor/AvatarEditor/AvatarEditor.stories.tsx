import { useState } from "react";
import { decompressFrames, parseGIF } from "gifuct-js";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import AvatarEditor from "./index";

import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createGifFixture } from "@/stories/gifFixture";
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

const getDialog = async (canvasElement: HTMLElement) => {
  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog"),
  );
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
  );
  return dialog;
};

const openEdit = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "アイコン画像を編集" }),
  );
  return getDialog(canvasElement);
};

export const LocalPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    const select = canvas.getByRole("button", {
      name: "アイコン画像をアップロード",
    });
    await expect(
      select.querySelector('[data-testid="AddRoundedIcon"]'),
    ).not.toBeNull();
    await expect(getComputedStyle(select).borderRadius).toBe("50%");
    await userEvent.hover(select);
    await expect(getComputedStyle(select).borderRadius).toBe("50%");
    const input = canvas.getByLabelText(
      "アイコン画像をアップロードのファイル選択",
    );
    let selectionCount = 0;
    const handleSelectClick = (event: Event) => {
      event.preventDefault();
      selectionCount += 1;
    };
    input.addEventListener("click", handleSelectClick);
    await userEvent.click(
      canvas.getByRole("button", { name: "アイコン画像をアップロード" }),
    );
    input.removeEventListener("click", handleSelectClick);
    await expect(selectionCount).toBe(1);
    await userEvent.upload(input, await createImageFixture(1600, 1200));
    let dialog = await getDialog(canvasElement);
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
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
    const image = await canvas.findByRole("img", {
      name: "アイコン画像のプレビュー",
    });
    const savedURL = image.getAttribute("src");
    const edit = canvas.getByRole("button", { name: "アイコン画像を編集" });
    const preview = select.getBoundingClientRect();
    const button = edit.getBoundingClientRect();
    await expect([button.width, button.height]).toEqual([30, 30]);
    if (window.innerWidth >= 600) {
      await expect(button.top - preview.bottom).toBeGreaterThanOrEqual(8);
      await expect(
        Math.abs(
          button.left + button.width / 2 - preview.left - preview.width / 2,
        ),
      ).toBeLessThan(1);
    } else {
      await expect(button.left - preview.right).toBeGreaterThanOrEqual(8);
      await expect(
        Math.abs(
          button.top + button.height / 2 - preview.top - preview.height / 2,
        ),
      ).toBeLessThan(1);
    }
    await expect(
      select.querySelector('[data-testid="AddRoundedIcon"]'),
    ).not.toBeNull();
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
      expect(restoredTransform.m11).toBeCloseTo(savedTransform.m11, 1);
      expect(restoredTransform.m12).toBeCloseTo(savedTransform.m12, 1);
    });
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    await expect(image).toHaveAttribute("src", savedURL);
    await expect(edit).toHaveFocus();
    await expect(canvasElement.textContent).toBe("");
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};

export const SavedAvatarCannotBeEdited: Story = {
  args: { avatarURL: "/favicon-64x64.png" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("img", { name: "アイコン画像のプレビュー" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    const dataTransfer = new DataTransfer();
    const droppedImage = await createImageFixture(80, 80);
    dataTransfer.items.add(droppedImage);
    await expect(dataTransfer.files).toHaveLength(1);
    canvas
      .getByRole("button", { name: "アイコン画像をアップロード" })
      .dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));
    const dialog = await getDialog(canvasElement);
    await expect(
      dialog
        .getByLabelText("画像の切り抜き位置")
        .parentElement?.querySelector("img")?.naturalWidth,
    ).toBe(80);
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("dialog"),
      ).not.toBeInTheDocument(),
    );
    const image = await canvas.findByRole("img", {
      name: "アイコン画像のプレビュー",
    });
    const response = await fetch(image.getAttribute("src") ?? "");
    const bitmap = await createImageBitmap(await response.blob());
    await expect([bitmap.width, bitmap.height]).toEqual([80, 80]);
    bitmap.close();
    await userEvent.upload(
      canvas.getByLabelText("アイコン画像をアップロードのファイル選択"),
      await createImageFixture(160, 120),
    );
    const second = await getDialog(canvasElement);
    await expect(second.getByRole("slider")).toHaveValue("1");
    await expect(
      second
        .getByLabelText("画像の切り抜き位置")
        .parentElement?.querySelector("img")?.naturalWidth,
    ).toBe(160);
    await userEvent.click(second.getByRole("button", { name: "キャンセル" }));
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", {
        name: "アイコン画像をアップロード",
      }),
    ).toBeDisabled();
    await expect(
      within(canvasElement).queryByRole("listbox"),
    ).not.toBeInTheDocument();
  },
};

export const GifAndStillPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.upload(
      canvas.getByLabelText("アイコン画像をアップロードのファイル選択"),
      createGifFixture().file,
    );
    const dialog = within(await body.findByRole("dialog"));
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "GIF保存" })).toBeEnabled(),
    );
    await userEvent.click(dialog.getByRole("button", { name: "GIF保存" }));
    await waitFor(() =>
      expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const preview = await canvas.findByRole("img", {
      name: "アイコン画像のプレビュー",
    });
    const savedURL = preview.getAttribute("src") ?? "";
    const blob = await (await fetch(savedURL)).blob();
    await expect(blob.type).toBe("image/gif");
    const gif = parseGIF(await blob.arrayBuffer());
    await expect([
      gif.lsd.width,
      gif.lsd.height,
      decompressFrames(gif, true).length,
    ]).toEqual([120, 120, 3]);
    await userEvent.click(
      canvas.getByRole("button", { name: "アイコン画像を編集" }),
    );
    const reopened = within(await body.findByRole("dialog"));
    await waitFor(() =>
      expect(
        reopened.getByRole("button", { name: "静止画保存" }),
      ).toBeEnabled(),
    );
    await expect(
      reopened.getByRole("button", { name: "GIF保存" }),
    ).toBeEnabled();
    await userEvent.click(reopened.getByRole("button", { name: "静止画保存" }));
    await waitFor(() => expect(preview.getAttribute("src")).not.toBe(savedURL));
    const still = await (await fetch(preview.getAttribute("src") ?? "")).blob();
    await expect(still.type).toBe("image/webp");
  },
};

const AvatarSessionReset = () => {
  const [avatarURL, setAvatarURL] = useState("");
  return (
    <>
      <AvatarEditor avatarURL={avatarURL} isDisabled={false} />
      <Button onClick={() => setAvatarURL("/favicon-64x64.png")}>
        保存済みアイコンに切り替え
      </Button>
    </>
  );
};

export const ResetDuringEncoding: Story = {
  render: () => <AvatarSessionReset />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const source = await createImageFixture(160, 120);
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const encoding: { complete?: () => Promise<void> } = {};
    let encodingCount = 0;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (type !== "image/webp") {
        originalToBlob.call(this, callback, type, quality);
        return;
      }
      encodingCount += 1;
      encoding.complete = () =>
        new Promise<void>((resolve) => {
          originalToBlob.call(
            this,
            (blob) => {
              callback(blob);
              resolve();
            },
            type,
            quality,
          );
        });
    };
    try {
      await userEvent.upload(
        canvas.getByLabelText("アイコン画像をアップロードのファイル選択"),
        source,
      );
      const dialog = await getDialog(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() => expect(encodingCount).toBe(1));
      canvas
        .getByRole("button", { name: "保存済みアイコンに切り替え" })
        .click();
      await encoding.complete?.();
      await expect(
        await canvas.findByRole("img", { name: "アイコン画像のプレビュー" }),
      ).toHaveAttribute("src", "/favicon-64x64.png");
      await expect(
        canvas.queryByRole("button", { name: "アイコン画像を編集" }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByRole("button", { name: "アイコン画像をアップロード" }),
      ).toBeEnabled();
    } finally {
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    }
  },
};

export const CancelSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.upload(
      canvas.getByLabelText("アイコン画像をアップロードのファイル選択"),
      await createImageFixture(160, 120),
    );
    const dialog = await getDialog(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas
        .getByRole("button", { name: "アイコン画像をアップロード" })
        .querySelector('[data-testid="AddRoundedIcon"]'),
    ).not.toBeNull();
  },
};
