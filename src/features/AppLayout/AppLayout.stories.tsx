import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";

import AppLayout from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import MarkdownPreview from "@/features/MarkdownPreview";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/AppLayout",
  component: AppLayout,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ToastProvider>
          <Routes>
            <Route element={<Story />}>
              <Route
                path="/"
                element={
                  <div>
                    <div style={{ minHeight: 1600 }}>
                      <Link to="/other">別のページへ</Link>
                      <MarkdownPreview content="![画像](/favicon-192.png)" />
                      <p>スクロールする本文</p>
                    </div>
                  </div>
                }
              />
              <Route path="/other" element={<div>別のページ</div>} />
            </Route>
          </Routes>
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
} satisfies Meta<typeof AppLayout>;

export default META;
type Story = StoryObj<typeof META>;

export const ContentScroll: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByRole("main", { name: "ページの本文" });
    const header = canvas.getByRole("banner");
    const headerTop = header.getBoundingClientRect().top;
    content.scrollTop = 400;
    await expect(content.scrollTop).toBe(400);
    await expect(header.getBoundingClientRect().top).toBe(headerTop);

    await userEvent.click(
      canvas.getByRole("button", { name: "サイドバーを開く" }),
    );
    await expect(
      canvas.getByRole("dialog", { name: "サイドバー" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("dialog", { name: "サイドバー" })).toBeNull(),
    );
    await expect(content.scrollTop).toBe(400);

    await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
    const nextContent = canvas.getByRole("main", { name: "ページの本文" });
    await expect(within(nextContent).getByText("別のページ")).toBeVisible();
    await expect(nextContent.scrollTop).toBe(0);
  },
};
