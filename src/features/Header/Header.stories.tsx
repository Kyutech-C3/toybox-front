import { MemoryRouter } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";

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

    const lightBackground = getComputedStyle(document.body).backgroundColor;
    await userEvent.click(
      canvas.getByRole("button", { name: "ダークモードに切り替え" }),
    );
    await expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await expect(
      canvas.getByRole("button", { name: "ライトモードに切り替え" }),
    ).toBeVisible();
    expect(getComputedStyle(document.body).backgroundColor).not.toBe(
      lightBackground,
    );
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await expect(
      within(canvasElement).getByRole("button", {
        name: "ライトモードに切り替え",
      }),
    ).toBeVisible();
  },
};
