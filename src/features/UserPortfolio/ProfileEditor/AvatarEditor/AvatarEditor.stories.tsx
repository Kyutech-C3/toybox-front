import { act, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import AvatarEditor from "./index";

import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import {
  deferImageEncoding,
  findImageEditor,
} from "@/stories/imageEditorHelpers";
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

export const LocalPreview: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(
      "アイコン画像をアップロードのファイル選択",
    );
    const source = await createImageFixture(1600, 1200);
    await userEvent.upload(input, source);
    let dialog = await findImageEditor(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    await userEvent.upload(input, source);
    dialog = await findImageEditor(canvasElement);
    await fireEvent.change(dialog.getByRole("slider"), {
      target: { value: "2" },
    });
    await userEvent.click(dialog.getByRole("button", { name: "保存" }));
    const image = await canvas.findByRole("img", {
      name: "アイコン画像のプレビュー",
    });
    await waitFor(() =>
      expect(image).toHaveAttribute("src", expect.stringContaining("blob:")),
    );
    const savedURL = image.getAttribute("src");
    const edit = canvas.getByRole("button", { name: "アイコン画像を編集" });
    await userEvent.click(edit);
    dialog = await findImageEditor(canvasElement);
    await waitFor(() =>
      expect(
        Number((dialog.getByRole("slider") as HTMLInputElement).value),
      ).toBeCloseTo(2, 1),
    );
    await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    await expect(image).toHaveAttribute("src", savedURL);
    await expect(edit).toHaveFocus();
  },
};

export const SavedAvatarCannotBeEdited: Story = {
  args: { avatarURL: "/favicon-64x64.png" },
};

export const Disabled: Story = {
  args: { isDisabled: true },
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
  tags: ["test"],
  render: () => <AvatarSessionReset />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const encoding = deferImageEncoding();
    try {
      await userEvent.upload(
        canvas.getByLabelText("アイコン画像をアップロードのファイル選択"),
        await createImageFixture(160, 120),
      );
      const dialog = await findImageEditor(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await encoding.waitForStart();
      await act(() =>
        canvas
          .getByRole("button", { name: "保存済みアイコンに切り替え" })
          .click(),
      );
      await encoding.complete();
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
      encoding.restore();
    }
  },
};
