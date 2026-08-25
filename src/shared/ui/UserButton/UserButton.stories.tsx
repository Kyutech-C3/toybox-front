import { MemoryRouter } from "react-router-dom";

import UserButton from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof UserButton> = {
  title: "UI/UserButton",
  component: UserButton,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    userID: "user-1",
    displayName: "UserName",
    avatarURL: "/comingSoonLugia.webp",
  },
};

export const LongDisplayName: Story = {
  args: {
    userID: "user-2",
    displayName: "とても長い表示名のユーザーです",
    avatarURL: "/comingSoonLugia.webp",
  },
};
