import Button from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClick: { action: "clicked" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
    },
    children: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "送信",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    children: "送信",
    disabled: true,
  },
};

export const CustomText: Story = {
  args: {
    children: "投稿する",
    disabled: false,
  },
};

export const Submit: Story = {
  args: {
    children: "送信",
    type: "submit",
    disabled: false,
  },
};
