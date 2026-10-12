import { MemoryRouter } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";

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

    const trigger = canvas.getByRole("button", { name: "サイドバーを開く" });
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    trigger.focus();
    await userEvent.keyboard(" ");
    const sidebar = canvas.getByRole("dialog", { name: "サイドバー" });
    const navigation = within(sidebar);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      navigation.getByRole("button", { name: "サイドバーを閉じる" }),
    ).toHaveFocus();
    await expect(
      navigation.queryByRole("link", { name: "マイページ" }),
    ).toBeNull();
    await expect(
      navigation.getByRole("link", { name: "C3 公式サイト" }),
    ).toHaveAttribute("href", "https://compositecomputer.club/");
    await expect(
      navigation.getByRole("link", { name: "C3 X" }),
    ).toHaveAttribute("href", "https://x.com/c3_kyutech");
    await expect(
      navigation.getByRole("link", { name: "C3 Youtubeチャンネル" }),
    ).toHaveAttribute(
      "href",
      "https://www.youtube.com/@compositecomputerclub2597",
    );
    await expect(
      navigation.getByRole("link", { name: "C3 GitHub" }),
    ).toHaveAttribute("href", "https://github.com/Kyutech-C3");
    await expect(
      navigation.getByText(
        `© ${new Date().getFullYear()} Composite Computer Club`,
      ),
    ).toBeVisible();
    await userEvent.tab();
    await expect(
      navigation.getByRole("link", { name: "Toybox ホーム" }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(
      navigation.getByRole("link", { name: "ホーム" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(sidebar).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard("{Enter}");
    await userEvent.click(navigation.getByRole("link", { name: "ホーム" }));
    await waitFor(() => expect(sidebar).not.toBeVisible());

    await userEvent.click(trigger);
    await userEvent.click(
      navigation.getByRole("button", { name: "サイドバーを閉じる" }),
    );
    await waitFor(() => expect(sidebar).not.toBeVisible());

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
