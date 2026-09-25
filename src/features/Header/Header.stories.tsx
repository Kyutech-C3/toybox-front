import { MemoryRouter } from "react-router-dom";
import { expect, within } from "storybook/test";

import Header from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Header",
  component: Header,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </MemoryRouter>
    ),
  ],
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null });
    useUserStore.getState().clearUser();
  },
} satisfies Meta<typeof Header>;

export default META;
type Story = StoryObj<typeof META>;

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "logo-image" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "ログイン" }),
    ).toBeVisible();
  },
};
