import { expect, waitFor, within } from "storybook/test";

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
    avatarURL: "./comingSoonLugia.webp",
  },
};

export const CustomImage: Story = {
  args: {
    avatarURL: "/comingSoonHo-Oh.webp",
    alt: "カスタムアバター",
  },
  play: async ({ canvasElement }) => {
    const image = within(canvasElement).getByRole("img", {
      name: "カスタムアバター",
    });
    await waitFor(() =>
      expect((image as HTMLImageElement).naturalWidth).toBeGreaterThan(0),
    );
  },
};

export const Profile: Story = {
  args: {
    avatarURL: "./comingSoonLugia.webp",
    alt: "プロフィール画像",
    size: "profile",
  },
};

export const LoadErrorFallback: Story = {
  args: { avatarURL: "/missing-avatar.webp", alt: "代替アバター" },
  play: async ({ canvasElement }) => {
    const image = within(canvasElement).getByRole("img", {
      name: "代替アバター",
    });
    await waitFor(() =>
      expect(image).toHaveAttribute(
        "src",
        expect.stringContaining("comingSoonLugia.webp"),
      ),
    );
  },
};
