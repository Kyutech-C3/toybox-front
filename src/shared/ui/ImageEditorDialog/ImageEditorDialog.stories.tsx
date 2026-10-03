import { useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import ImageEditorDialog from "./index";

import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";

type ImageEditorExampleProps = {
  purpose: "avatar" | "thumbnail";
  width: number;
  height: number;
  isInvalid?: boolean;
};

const ImageEditorExample = ({
  purpose,
  width,
  height,
  isInvalid = false,
}: ImageEditorExampleProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  return (
    <>
      <Button
        onClick={async () => {
          setFile(
            isInvalid
              ? new File(["broken"], "photo.png", { type: "image/png" })
              : await createImageFixture(width, height),
          );
        }}
      >
        画像を編集
      </Button>
      <output aria-label="加工結果">{result}</output>
      {file && (
        <ImageEditorDialog
          file={file}
          purpose={purpose}
          onClose={() => setFile(null)}
          onConfirm={async (edited) => {
            setFile(null);
            const bitmap = await createImageBitmap(edited);
            setResult(`${bitmap.width} × ${bitmap.height}px / ${edited.type}`);
            bitmap.close();
          }}
        />
      )}
    </>
  );
};

const META = {
  title: "Shared/ImageEditorDialog",
  component: ImageEditorExample,
  args: { purpose: "thumbnail", width: 1600, height: 1200 },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ImageEditorExample>;
export default META;
type Story = StoryObj<typeof META>;

const openEditor = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "画像を編集" }),
  );
  const dialog = await within(canvasElement.ownerDocument.body).findByRole(
    "dialog",
  );
  await waitFor(() =>
    expect(within(dialog).getByRole("button", { name: "保存" })).toBeEnabled(),
  );
  return dialog;
};

export const Thumbnail: Story = {
  play: async ({ canvasElement }) => {
    const element = await openEditor(canvasElement);
    const dialog = within(element);
    await expect(element.textContent).toBe("キャンセル保存");
    await expect(dialog.getAllByRole("button")).toHaveLength(2);
    await expect(dialog.getAllByRole("slider")).toHaveLength(1);
    await expect(dialog.queryByRole("heading")).not.toBeInTheDocument();
    await expect(dialog.queryByRole("spinbutton")).not.toBeInTheDocument();
    await expect(dialog.queryByRole("radio")).not.toBeInTheDocument();
    await expect(element.querySelector("canvas")).toBeNull();
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("1600 × 1200px / image/webp"),
    );
  },
};

export const ZoomAndMove: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    await fireEvent.change(dialog.getByRole("slider"), {
      target: { value: "2" },
    });
    const cropper = dialog.getByLabelText("画像の切り抜き位置");
    const image = cropper.parentElement?.querySelector("img");
    const transform = image?.style.transform;
    cropper.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    await expect(image?.style.transform).not.toBe(transform);
    const beforeDrag = image?.style.transform;
    const bounds = cropper.getBoundingClientRect();
    await fireEvent.mouseDown(cropper, {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
      button: 0,
    });
    await fireEvent.mouseMove(canvasElement.ownerDocument, {
      clientX: bounds.left + bounds.width / 2 + 40,
      clientY: bounds.top + bounds.height / 2 + 20,
    });
    await waitFor(() => expect(image?.style.transform).not.toBe(beforeDrag));
    await fireEvent.mouseUp(canvasElement.ownerDocument);
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("800 × 600px / image/webp"),
    );
  },
};

export const LowResolution: Story = {
  args: { width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("160 × 120px / image/webp"),
    );
  },
};

export const Avatar: Story = {
  args: { purpose: "avatar" },
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("512 × 512px / image/webp"),
    );
  },
};

export const LowResolutionAvatar: Story = {
  args: { purpose: "avatar", width: 80, height: 80 },
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("80 × 80px / image/webp"),
    );
  },
};

export const KeyboardCancel: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    const cropper = dialog.getByLabelText("画像の切り抜き位置");
    cropper.focus();
    await userEvent.tab({ shift: true });
    await expect(dialog.getByRole("button", { name: "保存" })).toHaveFocus();
    await userEvent.tab();
    await expect(cropper).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog"),
    ).not.toBeInTheDocument();
    await expect(
      within(canvasElement).getByRole("button", { name: "画像を編集" }),
    ).toHaveFocus();
    await expect(
      within(canvasElement).getByLabelText("加工結果"),
    ).toBeEmptyDOMElement();
  },
};

export const UnreadableImage: Story = {
  args: { isInvalid: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "画像を編集" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent(
      "画像を読み込めませんでした",
    );
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
