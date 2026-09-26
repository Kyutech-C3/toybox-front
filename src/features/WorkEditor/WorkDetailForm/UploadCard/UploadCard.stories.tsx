import { expect, fn, userEvent, within } from "storybook/test";

import UploadArea from "../UploadArea";
import UploadCard from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";

const META = {
  title: "Features/WorkEditor/UploadCard",
  component: UploadCard,
  decorators: [
    (Story) => (
      <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
        <Story />
      </div>
    ),
  ],
  args: {
    asset: {
      key: "image",
      fileName: "長い名前の画像ファイル.png",
      kind: "画像",
      status: "success",
      assetID: "image",
      previewURL: "/comingSoonLugia.webp",
      file: null,
      errorMessage: "",
    },
    children: (
      <img
        src="/comingSoonLugia.webp"
        alt="プレビュー"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    ),
    statusText: "画像",
    onRemove: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof UploadCard>;
export default META;
type Story = StoryObj<typeof META>;
export const Uploaded: Story = {};
export const Empty: Story = {
  args: {
    asset: null,
    hasPreview: false,
    children: (
      <UploadArea
        accept="image/png"
        ariaLabel="サムネイル画像をアップロード"
        onSelectFiles={fn()}
        isEmbedded
      />
    ),
  },
};
export const Uploading: Story = {
  args: {
    asset: { ...META.args.asset, status: "uploading" },
    statusText: "画像・アップロード中",
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: /を削除/,
    });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};
export const Failed: Story = {
  args: {
    asset: { ...META.args.asset, status: "error" },
    statusText: "アップロードに失敗しました",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "アップロードに失敗しました",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: /再アップロード/ }),
    );
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole("button", { name: /を削除/ }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};
