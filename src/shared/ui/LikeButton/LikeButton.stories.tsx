import { fn } from "storybook/test";

import LikeButton from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Shared/LikeButton",
  component: LikeButton,
  args: {
    count: 12,
    isLiked: false,
    isCountVisible: true,
    onToggle: fn(),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LikeButton>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

export const Liked: Story = {
  args: { isLiked: true },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    ariaLabel: "いいねを読み込み中",
  },
};
