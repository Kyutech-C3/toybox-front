import { useEffect, useState } from "react";
import { decompressFrames, parseGIF } from "gifuct-js";
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
import { createGifFixture } from "@/stories/gifFixture";

import type { Meta, StoryObj } from "@storybook/react";

type GifEditorExampleProps = {
  purpose: "avatar" | "thumbnail";
  hasDisposalFrames: boolean;
};

const GifEditorExample = ({
  purpose,
  hasDisposalFrames,
}: GifEditorExampleProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [resultURL, setResultURL] = useState("");
  useEffect(
    () => () => {
      if (resultURL) URL.revokeObjectURL(resultURL);
    },
    [resultURL],
  );
  return (
    <>
      <Button onClick={() => setFile(createGifFixture(hasDisposalFrames).file)}>
        GIFを編集
      </Button>
      <output aria-label="加工結果">{result?.type}</output>
      {file && (
        <ImageEditorDialog
          file={file}
          purpose={purpose}
          onClose={() => setFile(null)}
          onConfirm={(edited) => {
            setResult(edited);
            setResultURL(URL.createObjectURL(edited));
            setFile(null);
          }}
        />
      )}
      {resultURL && <a href={resultURL}>加工後GIF</a>}
    </>
  );
};

const META = {
  title: "Shared/ImageEditorDialog/GIF",
  component: GifEditorExample,
  args: { purpose: "thumbnail", hasDisposalFrames: false },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof GifEditorExample>;
export default META;
type Story = StoryObj<typeof META>;

const openEditor = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "GIFを編集" }),
  );
  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog"),
  );
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: "GIF保存" })).toBeEnabled(),
  );
  await expect(
    dialog.queryByRole("button", { name: "保存" }),
  ).not.toBeInTheDocument();
  await expect(
    dialog.getByRole("button", { name: "静止画保存" }),
  ).toBeEnabled();
  return dialog;
};

const readResult = async (canvasElement: HTMLElement) => {
  const link = within(canvasElement).getByRole("link", {
    name: "加工後GIF",
  }) as HTMLAnchorElement;
  const gif = parseGIF(await (await fetch(link.href)).arrayBuffer());
  return { gif, frames: decompressFrames(gif, true) };
};

export const StillImageSave: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "静止画保存" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("image/webp"),
    );
  },
};

export const AnimatedAvatarCropAndRotation: Story = {
  args: { purpose: "avatar" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "右に90度回転" }));
    await fireEvent.change(dialog.getByRole("slider"), {
      target: { value: "2" },
    });
    await waitFor(() =>
      expect(dialog.getByLabelText("出力サイズ")).toHaveTextContent(
        "60 × 60px",
      ),
    );
    await userEvent.click(dialog.getByRole("button", { name: "GIF保存" }));
    await waitFor(() =>
      expect(canvas.getByLabelText("加工結果")).toHaveTextContent("image/gif"),
    );
    const { gif, frames } = await readResult(canvasElement);
    await expect([gif.lsd.width, gif.lsd.height, frames.length]).toEqual([
      60, 60, 3,
    ]);
    const delays = gif.frames.flatMap((frame) =>
      "gce" in frame ? [frame.gce.delay] : [],
    );
    await expect(delays).toEqual([7, 13, 0]);
    const application = gif.frames.find((frame) => "application" in frame);
    await expect(
      application && "application" in application
        ? Array.from(application.application.blocks)
        : null,
    ).toEqual([1, 2, 0]);
    const { palette } = createGifFixture();
    for (const sample of [
      { frame: 0, y: 15, color: palette[0] },
      { frame: 0, y: 45, color: palette[1] },
      { frame: 1, y: 15, color: palette[1] },
      { frame: 1, y: 45, color: palette[0] },
    ]) {
      const offset = (sample.y * 60 + 30) * 4;
      sample.color.forEach((channel, index) => {
        expect(
          Math.abs(frames[sample.frame].patch[offset + index] - channel),
        ).toBeLessThan(8);
      });
      await expect(frames[sample.frame].patch[offset + 3]).toBe(255);
    }
  },
};

export const TransparencyAndDisposal: Story = {
  args: { hasDisposalFrames: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "GIF保存" }));
    await waitFor(() =>
      expect(canvas.getByLabelText("加工結果")).toHaveTextContent("image/gif"),
    );
    const { frames } = await readResult(canvasElement);
    await expect(frames).toHaveLength(4);
    const { palette } = createGifFixture();
    // dispose=3で前の背景に戻し、dispose=2で消えた領域は透過になる。
    for (const sample of [
      { frame: 1, x: 20, y: 20, color: palette[1] },
      { frame: 2, x: 60, y: 45, color: palette[0] },
      { frame: 3, x: 10, y: 10, color: palette[0] },
    ]) {
      const offset = (sample.y * 160 + sample.x) * 4;
      sample.color.forEach((channel, index) => {
        expect(
          Math.abs(frames[sample.frame].patch[offset + index] - channel),
        ).toBeLessThan(8);
      });
      await expect(frames[sample.frame].patch[offset + 3]).toBe(255);
    }
    await expect(frames[3].patch[(20 * 160 + 30) * 4 + 3]).toBe(0);
  },
};

export const CancelDuringGifSave: Story = {
  play: async ({ canvasElement }) => {
    const post = spyOn(Worker.prototype, "postMessage").mockImplementation(
      () => undefined,
    );
    const terminate = spyOn(Worker.prototype, "terminate");
    try {
      const dialog = await openEditor(canvasElement);
      const save = dialog.getByRole("button", { name: "GIF保存" });
      await userEvent.dblClick(save);
      await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
      await expect(save).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "静止画保存" }),
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "キャンセル" }),
      ).toBeEnabled();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(terminate).toHaveBeenCalledTimes(1));
      await expect(
        within(canvasElement.ownerDocument.body).queryByRole("dialog"),
      ).not.toBeInTheDocument();
      await expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toBeEmptyDOMElement();
    } finally {
      post.mockRestore();
      terminate.mockRestore();
    }
  },
};

export const GifErrorAllowsStillSave: Story = {
  play: async ({ canvasElement }) => {
    const post = spyOn(Worker.prototype, "postMessage").mockImplementation(
      function (this: Worker) {
        queueMicrotask(() =>
          this.dispatchEvent(
            new MessageEvent("message", { data: { type: "error" } }),
          ),
        );
      },
    );
    try {
      const dialog = await openEditor(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "GIF保存" }));
      await expect(
        await within(canvasElement.ownerDocument.body).findByRole("alert"),
      ).toHaveTextContent("GIFを加工できませんでした");
      await waitFor(() =>
        expect(
          dialog.getByRole("button", { name: "静止画保存" }),
        ).toBeEnabled(),
      );
      await userEvent.click(dialog.getByRole("button", { name: "静止画保存" }));
      await waitFor(() =>
        expect(
          within(canvasElement).getByLabelText("加工結果"),
        ).toHaveTextContent("image/webp"),
      );
    } finally {
      post.mockRestore();
    }
  },
};
