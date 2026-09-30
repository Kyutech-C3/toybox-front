import { expect, within } from "storybook/test";

import Input from "../Input";
import FieldError from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/FieldError",
  component: FieldError,
  args: { children: "入力内容を確認してください", role: "alert" },
} satisfies Meta<typeof FieldError>;
export default META;
type Story = StoryObj<typeof META>;
export const Default: Story = {};
export const Multiline: Story = {
  args: {
    children:
      "画像の形式を確認してください\nファイルサイズは5MB以下にしてください",
  },
};
export const AssociatedInput: Story = {
  render: (args) => (
    <>
      <Input
        aria-label="URL"
        value="invalid"
        onChange={() => {}}
        aria-invalid
        aria-describedby="url-error"
      />
      <FieldError {...args} id="url-error" />
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("textbox", { name: "URL" }),
    ).toHaveAccessibleDescription("入力内容を確認してください");
  },
};
