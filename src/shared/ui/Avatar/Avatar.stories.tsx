import Avatar from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    avatarURL: { control: "text" },
  },
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    avatarURL: "./comingSoonLugia.webp",
  },
};

export const CustomImage: Story = {
  args: {
    avatarURL: "https://via.placeholder.com/46x46.png?text=Avatar",
  },
};
