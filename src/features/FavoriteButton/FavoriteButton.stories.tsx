import { expect, within } from "storybook/test";

import FavoriteButton from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/FavoriteButton",
  component: FavoriteButton,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { workID: "work-1", isInitiallyLiked: false, isCountVisible: true },
  beforeEach: () => useAuthStore.setState({ accessToken: null }),
} satisfies Meta<typeof FavoriteButton>;

export default META;
type Story = StoryObj<typeof META>;

export const LoginRequired: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button")).toBeDisabled();
    await expect(
      within(canvasElement).getByRole("button"),
    ).toHaveAccessibleName("いいねするにはログインが必要です");
  },
};

export const InitiallyLiked: Story = { args: { isInitiallyLiked: true } };
