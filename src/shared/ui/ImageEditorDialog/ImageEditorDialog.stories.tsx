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

import type { Meta, StoryObj } from "@storybook/react";
import type { ImageEditSettings } from "./index";

type ImageEditorExampleProps = {
  settings: ImageEditSettings;
  width: number;
  height: number;
  isInvalid?: boolean;
};

const ImageEditorExample = ({
  settings,
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
          settings={settings}
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

const DEFAULT_SETTINGS = {
  aspect: 1,
  longSide: 256,
  cropShape: "round",
} satisfies ImageEditSettings;

const META = {
  title: "Shared/ImageEditorDialog",
  component: ImageEditorExample,
  args: { settings: DEFAULT_SETTINGS, width: 1600, height: 1200 },
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
  return findImageEditor(canvasElement);
};

export const CustomSettings: Story = {
  tags: ["test"],
  args: { settings: { aspect: 16 / 9, longSide: 640, cropShape: "rect" } },
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
        ).toHaveTextContent("640 × 360px / image/webp"),
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
    await fireEvent.change(dialog.getByRole("slider", { name: "回転" }), {
      target: { value: "37" },
    });
    await waitFor(() =>
      expect(dialog.getByLabelText("出力サイズ")).toHaveTextContent(
        "120 × 120px",
      ),
    );
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("120 × 120px / image/webp"),
    );
  },
};

export const OutsideImageBounds: Story = {
  tags: ["test"],
  args: { width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    const cropper = dialog.getByRole("group", { name: "画像の切り抜き位置" });
    const bounds = cropper.getBoundingClientRect();
    const start = {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    await fireEvent.mouseDown(cropper, start);
    await fireEvent.mouseMove(canvasElement.ownerDocument, {
      ...start,
      clientX: start.clientX + bounds.width * 10,
    });
    await new Promise(requestAnimationFrame);
    await fireEvent.mouseUp(canvasElement.ownerDocument);
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    const image = await within(canvasElement).findByRole<HTMLImageElement>(
      "img",
      { name: "加工後の画像" },
    );
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
    const output = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
    const context = output.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0);
    const sample = (fraction: number) =>
      context.getImageData(
        Math.floor(output.width * fraction),
        Math.floor(output.height / 2),
        1,
        1,
      ).data;
    // 外側は透過で保存し、25%を超えて写真から離れない。
    await expect(sample(0.1)[3]).toBe(0);
    await expect(Math.max(...sample(0.35).slice(0, 3))).toBeGreaterThan(32);
    await expect(sample(0.35)[3]).toBe(255);
  },
};

export const Avatar: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    const slider = dialog.getByRole("slider", { name: "ズーム" });
    const cropper = dialog.getByRole("group", { name: "画像の切り抜き位置" });
    const bounds = cropper.getBoundingClientRect();
    const pointer = {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    await fireEvent.wheel(cropper, { ...pointer, deltaY: -100 });
    await waitFor(() =>
      expect(Number((slider as HTMLInputElement).value)).toBeGreaterThan(1),
    );
    await fireEvent.wheel(cropper, { ...pointer, deltaY: -10000 });
    await waitFor(() => expect(slider).toHaveValue("10"));
    await fireEvent.wheel(cropper, { ...pointer, deltaY: 10000 });
    await waitFor(() => expect(slider).toHaveValue("1"));
    const maxSize = DEFAULT_SETTINGS.longSide;
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
    const rotation = dialog.getByRole("slider", { name: "回転" });
    await fireEvent.change(rotation, { target: { value: "-37" } });
    await expect(rotation).toHaveValue("-37");
    await expect(slider).toHaveValue("2.14");
    await userEvent.click(dialog.getByRole("button", { name: "左に1度回転" }));
    await expect(rotation).toHaveValue("-38");
    await userEvent.click(dialog.getByRole("button", { name: "右に1度回転" }));
    await expect(rotation).toHaveValue("-37");
    await userEvent.click(dialog.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(slider).toHaveValue("1"));
    await expect(rotation).toHaveValue("0");
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent(
        `${DEFAULT_SETTINGS.longSide} × ${DEFAULT_SETTINGS.longSide}px / image/webp`,
      ),
    );
  },
};

export const RotationAroundCropCenter: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await fireEvent.change(dialog.getByRole("slider", { name: "ズーム" }), {
      target: { value: "2" },
    });
    const cropper = dialog.getByRole("group", { name: "画像の切り抜き位置" });
    const bounds = cropper.getBoundingClientRect();
    const start = {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    await fireEvent.mouseDown(cropper, start);
    await fireEvent.mouseMove(canvasElement.ownerDocument, {
      clientX: start.clientX + bounds.height / 4,
      clientY: start.clientY - bounds.height / 4,
    });
    await new Promise(requestAnimationFrame);
    await fireEvent.mouseUp(canvasElement.ownerDocument);
    await fireEvent.change(dialog.getByRole("slider", { name: "回転" }), {
      target: { value: "90" },
    });
    await userEvent.click(dialog.getByRole("button", { name: "左に1度回転" }));
    await userEvent.click(dialog.getByRole("button", { name: "右に1度回転" }));
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    const image = await within(canvasElement).findByRole<HTMLImageElement>(
      "img",
      { name: "加工後の画像" },
    );
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
    const output = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
    const context = output.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0);
    const center = context.getImageData(
      output.width / 2,
      output.height / 2,
      1,
      1,
    ).data;
    context.fillStyle = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--primary-color");
    context.fillRect(0, 0, 1, 1);
    const expected = context.getImageData(0, 0, 1, 1).data;
    // 移動後の枠の中心にある左半分の色が、回転しても中心に残る。
    expected.forEach((channel, index) => {
      expect(Math.abs(center[index] - channel)).toBeLessThan(8);
    });
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
