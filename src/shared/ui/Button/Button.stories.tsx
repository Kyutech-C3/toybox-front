import AddRoundedIcon from "@mui/icons-material/AddRounded";
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

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "削除",
  },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "キャンセル" },
};

export const WithIcon: Story = {
  tags: ["test"],
  args: { variant: "accent", icon: <AddRoundedIcon />, children: "投稿" },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "投稿" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const IconOnly: Story = {
  args: {
    variant: "ghost",
    size: "small",
    isIconOnly: true,
    icon: <AddRoundedIcon />,
    children: undefined,
    "aria-label": "追加",
  },
};

export const Loading: Story = {
  tags: ["test"],
  args: { variant: "accent", isLoading: true, children: "保存中..." },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "保存中...",
    });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.querySelector("output")).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const NativeDisabled: Story = {
  tags: ["test"],
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "ボタン",
    });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Link: Story = {
  args: { variant: "link", size: "small", children: "全件表示" },
};
