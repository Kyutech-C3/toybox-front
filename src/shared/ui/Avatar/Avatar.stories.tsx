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
    alt: { control: "text" },
    size: { control: "radio", options: ["default", "profile"] },
  },
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    avatarURL: "",
  },
};

export const Profile: Story = {
  args: {
    avatarURL: "",
    alt: "プロフィール画像",
    size: "profile",
  },
};

export const BrokenImage: Story = {
  args: { avatarURL: "/missing-avatar.svg" },
};
