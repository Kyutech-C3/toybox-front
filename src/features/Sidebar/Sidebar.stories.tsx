import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";

import Sidebar from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Meta, StoryObj } from "@storybook/react";

const SidebarPreview = () => {
  const { pathname } = useLocation();
  return (
    <>
      <Sidebar />
      <output aria-label="現在のパス">{pathname}</output>
    </>
  );
};

const META = {
  title: "Features/Sidebar",
  component: Sidebar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Sidebar>;

export default META;
type Story = StoryObj<typeof META>;

export const LoggedIn: Story = {
  tags: ["test"],
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "sidebar-story-token" });
    useUserStore.getState().setUser({
      id: "sidebar-user",
      display_name: "テストユーザー",
      icon_url: "",
    });
    return () => {
      useAuthStore.setState({ accessToken: null });
      useUserStore.getState().clearUser();
    };
  },
  render: () => <SidebarPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "サイドバーを開く" });
    await userEvent.click(trigger);
    const sidebar = canvas.getByRole("dialog", { name: "サイドバー" });
    await expect(sidebar).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(sidebar).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(
      within(sidebar).getByRole("button", { name: "サイドバーを閉じる" }),
    ).toHaveFocus();
    const myPage = within(sidebar).getByRole("link", { name: "マイページ" });
    await expect(myPage).toHaveAttribute("href", "/users/sidebar-user");
    await userEvent.click(myPage);
    await waitFor(() => expect(sidebar).not.toBeVisible());
    await expect(
      canvas.getByRole("status", { name: "現在のパス" }),
    ).toHaveTextContent("/users/sidebar-user");
  },
};
