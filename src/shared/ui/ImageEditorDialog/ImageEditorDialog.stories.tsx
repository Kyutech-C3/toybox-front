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
    await expect(
      dialog.getByRole("heading", { name: "サムネイル画像を編集" }),
    ).toBeVisible();
    await expect(dialog.queryByRole("img")).not.toBeInTheDocument();
    await expect(dialog.queryByText("完成プレビュー")).not.toBeInTheDocument();
    await expect(
      dialog.queryByText("写真をドラッグして位置を調整できます"),
    ).not.toBeInTheDocument();
    await expect(
      dialog.queryByText("位置を細かく調整"),
    ).not.toBeInTheDocument();
    await expect(dialog.getByLabelText("出力サイズ")).toHaveTextContent(
      "1600 × 1200px",
    );
    await expect(dialog.getAllByRole("slider")).toHaveLength(1);
    await expect(dialog.queryByRole("spinbutton")).not.toBeInTheDocument();
    await expect(dialog.queryByRole("radio")).not.toBeInTheDocument();
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

export const RotationAndReset: Story = {
  args: { purpose: "avatar", width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    const getSourceImage = () =>
      dialog
        .getByLabelText("画像の切り抜き位置")
        .parentElement?.querySelector("img");
    const image = getSourceImage();
    if (!image) throw new Error("Source image unavailable");
    const source = document.createElement("canvas");
    source.width = 160;
    source.height = 120;
    const context = source.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    await waitFor(() => expect(image.naturalWidth).toBe(160));
    context.drawImage(image, 0, 0);
    const originalLeft = Array.from(context.getImageData(40, 60, 1, 1).data);
    const originalRight = Array.from(context.getImageData(120, 60, 1, 1).data);
    await expect(originalLeft).not.toEqual(originalRight);
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await waitFor(() =>
      expect(getSourceImage()?.style.transform).toContain("rotate(90deg)"),
    );
    await userEvent.click(dialog.getByRole("button", { name: "ズームを拡大" }));
    await expect(
      Number((dialog.getByRole("slider") as HTMLInputElement).value),
    ).toBeCloseTo(1.1);
    await userEvent.click(dialog.getByRole("button", { name: "リセット" }));
    await waitFor(() => {
      expect(dialog.getByRole("slider")).toHaveValue("1");
      expect(getSourceImage()?.style.transform).toContain("rotate(0deg)");
    });
    await userEvent.click(dialog.getByRole("button", { name: "左に90度回転" }));
    await waitFor(() =>
      expect(getSourceImage()?.style.transform).toContain("rotate(270deg)"),
    );
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await waitFor(() =>
      expect(getSourceImage()?.style.transform).toContain("rotate(90deg)"),
    );
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    const output = await within(canvasElement).findByRole("img", {
      name: "加工後の画像",
    });
    await waitFor(() =>
      expect((output as HTMLImageElement).naturalWidth).toBe(120),
    );
    const result = document.createElement("canvas");
    result.width = 120;
    result.height = 120;
    const resultContext = result.getContext("2d");
    if (!resultContext) throw new Error("Canvas unavailable");
    resultContext.drawImage(output as HTMLImageElement, 0, 0);
    for (const sample of [
      { y: 30, color: originalLeft },
      { y: 90, color: originalRight },
    ]) {
      const actual = resultContext.getImageData(60, sample.y, 1, 1).data;
      sample.color.forEach((channel, index) => {
        expect(Math.abs(actual[index] - channel)).toBeLessThan(8);
      });
    }
  },
};

export const MaximumZoom: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    const slider = dialog.getByRole("slider");
    await fireEvent.change(slider, { target: { value: "9.9" } });
    await userEvent.click(dialog.getByRole("button", { name: "ズームを拡大" }));
    await expect(slider).toHaveValue("10");
    await expect(
      dialog.getByRole("button", { name: "ズームを拡大" }),
    ).toBeDisabled();
    const image = dialog
      .getByLabelText("画像の切り抜き位置")
      .parentElement?.querySelector("img");
    await waitFor(() => {
      expect(image?.style.transform).toContain("scale(10)");
      expect(dialog.getByLabelText("出力サイズ")).toHaveTextContent(
        "160 × 120px",
      );
    });
    await userEvent.click(dialog.getByRole("button", { name: "ズームを縮小" }));
    await expect(Number((slider as HTMLInputElement).value)).toBeCloseTo(9.9);
    await fireEvent.change(slider, { target: { value: "10" } });
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("160 × 120px / image/webp"),
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

export const StrictModeImageLoading: Story = {
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
      const dialog = within(await openEditor(canvasElement));
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(
          within(canvasElement).getByLabelText("加工結果"),
        ).toHaveTextContent("1600 × 1200px / image/webp"),
      );
      const reopenedDialog = within(await openEditor(canvasElement));
      await userEvent.click(
        reopenedDialog.getByRole("button", { name: "キャンセル" }),
      );
      await expect(failedImages).toEqual([]);
    } finally {
      sourceSpy.mockRestore();
    }
  },
};
