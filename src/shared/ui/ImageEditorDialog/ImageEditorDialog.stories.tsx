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
    await expect(
      dialog.getByRole("img", { name: "切り抜き後の画像" }),
    ).toBeVisible();
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
    const preview = dialog.getByRole("img", {
      name: "切り抜き後の画像",
    }) as HTMLCanvasElement;
    await expect(getComputedStyle(preview).borderRadius).toBe("50%");
    const context = preview.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const colorAt = (x: number, y: number) =>
      Array.from(context.getImageData(x, y, 1, 1).data);
    let originalLeft: number[] = [];
    let originalRight: number[] = [];
    await waitFor(() => {
      originalLeft = colorAt(30, 60);
      originalRight = colorAt(90, 60);
      expect(originalLeft[3]).toBe(255);
      expect(originalLeft).not.toEqual(originalRight);
    });
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await waitFor(() => {
      expect(colorAt(60, 30)).toEqual(originalLeft);
      expect(colorAt(60, 90)).toEqual(originalRight);
    });
    await userEvent.click(dialog.getByRole("button", { name: "ズームを拡大" }));
    await expect(
      Number((dialog.getByRole("slider") as HTMLInputElement).value),
    ).toBeCloseTo(1.1);
    await userEvent.click(dialog.getByRole("button", { name: "リセット" }));
    await waitFor(() => {
      expect(dialog.getByRole("slider")).toHaveValue("1");
      expect(colorAt(30, 60)).toEqual(originalLeft);
      expect(colorAt(90, 60)).toEqual(originalRight);
    });
    await userEvent.click(dialog.getByRole("button", { name: "左に90度回転" }));
    await waitFor(() => {
      expect(colorAt(60, 30)).toEqual(originalRight);
      expect(colorAt(60, 90)).toEqual(originalLeft);
    });
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await waitFor(() => expect(colorAt(60, 30)).toEqual(originalLeft));
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

export const FineAdjustment: Story = {
  args: { purpose: "avatar", width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = within(await openEditor(canvasElement));
    await fireEvent.change(dialog.getByRole("slider"), {
      target: { value: "2" },
    });
    await userEvent.click(dialog.getByText("位置を細かく調整"));
    const image = dialog
      .getByLabelText("画像の切り抜き位置")
      .parentElement?.querySelector("img");
    const original = new DOMMatrix(image?.style.transform);
    await userEvent.click(
      dialog.getByRole("button", { name: "写真を右へ移動" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "写真を下へ移動" }),
    );
    await waitFor(() => {
      const moved = new DOMMatrix(image?.style.transform);
      expect(moved.m41).toBeGreaterThan(original.m41);
      expect(moved.m42).toBeGreaterThan(original.m42);
    });
    await userEvent.click(
      dialog.getByRole("button", { name: "写真を左へ移動" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "写真を上へ移動" }),
    );
    await waitFor(() => {
      const restored = new DOMMatrix(image?.style.transform);
      expect(restored.m41).toBeCloseTo(original.m41);
      expect(restored.m42).toBeCloseTo(original.m42);
    });
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
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
