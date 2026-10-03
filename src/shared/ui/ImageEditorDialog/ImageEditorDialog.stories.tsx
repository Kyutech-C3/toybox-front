import { useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import ImageEditorDialog from "./index";

import Button from "@/shared/ui/Button";
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
    expect(within(dialog).getByRole("button", { name: "適用" })).toBeEnabled(),
  );
  return within(dialog);
};

export const Thumbnail: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await expect(
      dialog.getByRole("radio", { name: "4:3（推奨）" }),
    ).toBeChecked();
    await expect(
      dialog.getByRole("img", { name: "4:3 のサムネイル表示プレビュー" }),
    ).toBeVisible();
  },
};

export const CropAndResize: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "512px" }));
    await userEvent.click(dialog.getByRole("radio", { name: "1:1" }));
    await waitFor(() =>
      expect(dialog.getByText("出力: 512 × 512px")).toBeVisible(),
    );
    const cropper = dialog.getByLabelText("画像の切り抜き位置");
    cropper.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    await userEvent.click(dialog.getByRole("button", { name: "適用" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("512 × 512px / image/webp"),
    );
  },
};

export const LowResolution: Story = {
  args: { width: 160, height: 120 },
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await expect(dialog.getByText("出力: 160 × 120px")).toBeVisible();
    await expect(dialog.getByText(/拡大せずに出力します/)).toBeVisible();
    await userEvent.click(
      dialog.getByRole("checkbox", {
        name: "元画像より大きい解像度への拡大を許可する",
      }),
    );
    await expect(dialog.getByText("出力: 1600 × 1200px")).toBeVisible();
    await expect(
      dialog.getByText(/写真の細部は鮮明になりません/),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole("checkbox"));
    await userEvent.click(dialog.getByRole("button", { name: "適用" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("160 × 120px"),
    );
  },
};

export const Avatar: Story = {
  args: { purpose: "avatar" },
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await expect(dialog.getByRole("radio", { name: "1:1" })).toBeChecked();
    await expect(
      dialog.getByRole("img", { name: "円形アイコンの仕上がり" }),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "適用" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("512 × 512px"),
    );
  },
};

export const CustomRatioAndValidation: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await userEvent.click(dialog.getByRole("radio", { name: "指定" }));
    const width = dialog.getByRole("spinbutton", { name: "比率の横" });
    const height = dialog.getByRole("spinbutton", { name: "比率の縦" });
    await userEvent.clear(width);
    await expect(dialog.getByRole("button", { name: "適用" })).toBeDisabled();
    await userEvent.type(width, "3");
    await userEvent.clear(height);
    await userEvent.type(height, "4");
    await userEvent.click(dialog.getByRole("button", { name: "512px" }));
    await waitFor(() =>
      expect(dialog.getByText("出力: 384 × 512px")).toBeVisible(),
    );
    const resolution = dialog.getByRole("spinbutton", {
      name: "出力解像度（長辺 px）",
    });
    await userEvent.clear(resolution);
    await userEvent.type(resolution, "4097");
    await expect(dialog.getByRole("button", { name: "適用" })).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "512px" }));
    await userEvent.click(dialog.getByRole("button", { name: "適用" }));
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText("加工結果"),
      ).toHaveTextContent("384 × 512px"),
    );
  },
};

export const KeyboardCancel: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    const zoom = dialog.getByRole("slider");
    zoom.focus();
    await fireEvent.change(zoom, { target: { value: "2" } });
    await expect(zoom).not.toHaveValue("1");
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
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await expect(await dialog.findByRole("alert")).toHaveTextContent(
      "画像を読み込めませんでした",
    );
    await expect(dialog.getByRole("button", { name: "適用" })).toBeDisabled();
  },
};

export const AvatarPreview: Story = {
  args: { purpose: "avatar" },
  play: async ({ canvasElement }) => {
    await openEditor(canvasElement);
  },
};
