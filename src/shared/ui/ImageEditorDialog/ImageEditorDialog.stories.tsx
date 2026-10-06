import { StrictMode, useEffect, useState } from "react";
import {
  expect,
  fireEvent,
  spyOn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import ImageEditorDialog from "./index";

import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { findImageEditor } from "@/stories/imageEditorHelpers";
import { createImageFixture } from "@/stories/imageFixture";
import { IMAGE_EDIT_SETTINGS } from "@/util/imageProcessing";

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
  const [resultURL, setResultURL] = useState("");
  useEffect(
    () => () => {
      if (resultURL) URL.revokeObjectURL(resultURL);
    },
    [resultURL],
  );
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
      {resultURL && <img src={resultURL} alt="加工後の画像" width={120} />}
      {file && (
        <ImageEditorDialog
          file={file}
          purpose={purpose}
          onClose={() => setFile(null)}
          onConfirm={async (edited) => {
            setFile(null);
            setResultURL(URL.createObjectURL(edited));
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

const THUMBNAIL_WIDTH = Math.min(1600, IMAGE_EDIT_SETTINGS.thumbnail.longSide);
const THUMBNAIL_SIZE = `${THUMBNAIL_WIDTH} × ${(THUMBNAIL_WIDTH * 3) / 4}px`;

const openEditor = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "画像を編集" }),
  );
  return findImageEditor(canvasElement);
};

export const Thumbnail: Story = {
  tags: ["test"],
  decorators: [
    (Story) => (
      <StrictMode>
        <Story />
      </StrictMode>
    ),
  ],
  play: async ({ canvasElement }) => {
    const failedImages: string[] = [];
    const setSource = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    )?.set;
    if (!setSource) throw new Error("Image src setter is unavailable");
    const sourceSpy = spyOn(
      HTMLImageElement.prototype,
      "src",
      "set",
    ).mockImplementation(function (this: HTMLImageElement, value: string) {
      this.addEventListener("error", () => failedImages.push(value), {
        once: true,
      });
      setSource.call(this, value);
    });
    try {
      const dialog = await openEditor(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(
          within(canvasElement).getByLabelText("加工結果"),
        ).toHaveTextContent(`${THUMBNAIL_SIZE} / image/webp`),
      );
      const reopenedDialog = await openEditor(canvasElement);
      await userEvent.click(
        reopenedDialog.getByRole("button", { name: "キャンセル" }),
      );
      await expect(failedImages).toEqual([]);
    } finally {
      sourceSpy.mockRestore();
    }
  },
};

export const LowResolution: Story = {
  tags: ["test"],
  args: { width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("160 × 120px / image/webp"),
    );
  },
};

export const Avatar: Story = {
  tags: ["test"],
  args: { purpose: "avatar" },
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    const slider = dialog.getByRole("slider");
    const maxSize = IMAGE_EDIT_SETTINGS.avatar.longSide;
    // 561pxの切り抜き範囲から上限サイズに縮小するときの浮動小数誤差も確認する。
    for (const { zoom, size } of [
      { zoom: "2.14", size: `${maxSize} × ${maxSize}px` },
      {
        zoom: String(Math.ceil((1200 / (maxSize - 1)) * 100) / 100),
        size: `${maxSize - 1} × ${maxSize - 1}px`,
      },
      { zoom: "2.14", size: `${maxSize} × ${maxSize}px` },
    ]) {
      await fireEvent.change(slider, { target: { value: zoom } });
      await waitFor(() =>
        expect(dialog.getByLabelText("出力サイズ")).toHaveTextContent(size),
      );
    }
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await userEvent.click(dialog.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(slider).toHaveValue("1"));
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent(
        `${IMAGE_EDIT_SETTINGS.avatar.longSide} × ${IMAGE_EDIT_SETTINGS.avatar.longSide}px / image/webp`,
      ),
    );
  },
};

export const KeyboardCancel: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
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
  tags: ["test"],
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
