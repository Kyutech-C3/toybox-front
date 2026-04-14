import Avater from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Avater> = {
  title: "UI/Avater",
  component: Avater,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    avatarURL: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

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
