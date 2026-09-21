import { expect, fn, userEvent, within } from "storybook/test";

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
    onClick: fn(),
  },
  tags: ["autodocs"],
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    if (args.isDisabled) {
      await expect(button).toBeDisabled();
      await userEvent.click(button);
      await expect(args.onClick).not.toHaveBeenCalled();
    } else {
      await expect(button).toBeEnabled();
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    }
  },
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
