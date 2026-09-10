import Button from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "ボタン",
    onClick: () => {},
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Primary: Story = {};

export const PrimaryActive: Story = {
  args: {
    isActive: true,
  },
};

export const PrimaryDisabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
    children: "保存する",
  },
};

export const AccentDisabled: Story = {
  args: {
    variant: "accent",
    children: "保存する",
    isDisabled: true,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "削除",
  },
};

export const DestructiveDisabled: Story = {
  args: {
    variant: "destructive",
    children: "削除中...",
    isDisabled: true,
  },
};
