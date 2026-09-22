import { MemoryRouter } from "react-router-dom";
import { expect, within } from "storybook/test";

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
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", {
        name: "UserNameのユーザーページを開く",
      }),
    ).toHaveAttribute("href", "/users/user-1");
  },
};

export const Compact: Story = {
  args: {
    userID: "user-1",
    displayName: "UserName",
    avatarURL: "/comingSoonLugia.webp",
    size: "compact",
  },
};

export const LongDisplayName: Story = {
  args: {
    userID: "user-2",
    displayName: "とても長い表示名のユーザーです",
    avatarURL: "/comingSoonLugia.webp",
  },
};
