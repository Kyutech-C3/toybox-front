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
    useAuthStore.setState({ accessToken: null, hasRestoreFailed: false });
    useUserStore.getState().clearUser();
  },
} satisfies Meta<typeof Header>;

export default META;
type Story = StoryObj<typeof META>;

export const LoggedOut: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "logo-image" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "ログイン" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "ログイン状態の確認を再試行" }),
    ).not.toBeInTheDocument();

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
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { docs: { story: { inline: false } } },
};

export const RestoreRetryFailure: Story = {
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null, hasRestoreFailed: true });
  },
};
