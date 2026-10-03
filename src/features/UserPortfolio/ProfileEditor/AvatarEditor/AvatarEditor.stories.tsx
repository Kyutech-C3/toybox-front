import { expect, userEvent, waitFor, within } from "storybook/test";

import AvatarEditor from "./index";

import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/UserPortfolio/AvatarEditor",
  component: AvatarEditor,
  args: { avatarURL: "", isDisabled: false },
} satisfies Meta<typeof AvatarEditor>;
export default META;
type Story = StoryObj<typeof META>;

export const LocalPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.upload(
      canvas.getByLabelText("アイコン画像のファイル選択"),
      await createImageFixture(1600, 1200),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "適用" })).toBeEnabled(),
    );
    await userEvent.click(dialog.getByRole("button", { name: "適用" }));
    await expect(
      await canvas.findByRole("img", { name: "アイコン画像のプレビュー" }),
    ).toHaveAttribute("src", expect.stringContaining("blob:"));
    const link = canvas.getByRole("link", { name: "加工画像をダウンロード" });
    await expect(link).toHaveAttribute("download", "photo.webp");
    await expect(
      canvas.getByText(/プロフィールを保存しても画像は更新されません/),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "アイコン画像を編集" }),
    );
    const secondDialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await expect(
      await secondDialog.findByText("元画像: 1600 × 1200px"),
    ).toBeVisible();
    await userEvent.click(
      secondDialog.getByRole("button", { name: "キャンセル" }),
    );
    await expect(link).toHaveAttribute("download", "photo.webp");
    await userEvent.click(
      canvas.getByRole("button", { name: "元のアイコンに戻す" }),
    );
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "写真を選択" }),
    ).toBeDisabled();
  },
};
