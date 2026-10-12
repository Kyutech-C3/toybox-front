import { useState } from "react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  ScrollRestoration,
  useNavigate,
} from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";

import AppLayout from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import MarkdownPreview from "@/features/MarkdownPreview";
import PageLoading from "@/shared/ui/PageLoading";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { getPageScroller } from "@/util/pageScroll";

import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

import "@/App.css";

const HomeContent = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: 1600, paddingTop: 500, boxSizing: "border-box" }}>
      <Link to="/other">別のページへ</Link>
      <button type="button" onClick={() => navigate(1)}>
        進む
      </button>
      <MarkdownPreview content="![画像](/favicon-192.png)" />
      <p>スクロールする本文</p>
    </div>
  );
};

const OtherContent = () => {
  const navigate = useNavigate();
  return (
    <div>
      <p>別のページ</p>
      <button type="button" onClick={() => navigate(-1)}>
        戻る
      </button>
    </div>
  );
};

type AppLayoutPreviewProps = {
  children: ReactNode;
};

const AppLayoutPreview = ({ children }: AppLayoutPreviewProps) => {
  const [router] = useState(() =>
    createMemoryRouter([
      {
        HydrateFallback: PageLoading,
        element: (
          <ToastProvider>
            {children}
            <ScrollRestoration />
          </ToastProvider>
        ),
        children: [
          {
            path: "/",
            loader: () =>
              new Promise((resolve) =>
                window.setTimeout(() => resolve(null), 100),
              ),
            element: <HomeContent />,
          },
          { path: "/other", element: <OtherContent /> },
        ],
      },
    ]),
  );
  return <RouterProvider router={router} />;
};

const META = {
  title: "Features/AppLayout",
  component: AppLayout,
  decorators: [
    (Story) => (
      <AppLayoutPreview>
        <Story />
      </AppLayoutPreview>
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
    const content = getPageScroller();
    await waitFor(() =>
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight + 400),
    );
    await waitFor(() =>
      expect(canvas.getByRole("img", { name: "画像" })).toHaveProperty(
        "complete",
        true,
      ),
    );
    const header = canvas.getByRole("banner");
    const headerTop = header.getBoundingClientRect().top;
    content.scrollTop = 400;
    await expect(content.scrollTop).toBe(400);
    await expect(header.getBoundingClientRect().top).toBe(headerTop);
    const paragraph = canvas.getByText("スクロールする本文");
    const paragraphTop = paragraph.getBoundingClientRect().top;

    await userEvent.click(
      canvas.getByRole("button", { name: "サイドバーを開く" }),
    );
    await expect(
      canvas.getByRole("dialog", { name: "サイドバー" }),
    ).toBeVisible();
    await expect(getComputedStyle(content).overflowY).toBe("scroll");
    await expect(content.scrollHeight).toBe(content.clientHeight);
    await expect(paragraph.getBoundingClientRect().top).toBe(paragraphTop);
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("dialog", { name: "サイドバー" })).toBeNull(),
    );
    await expect(content.scrollTop).toBe(400);

    await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
    await expect(canvas.getByText("別のページ")).toBeVisible();
    await expect(window.scrollY).toBe(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "サイドバーを開く" }),
    );
    await expect(getComputedStyle(content).overflowY).toBe("auto");
    await expect(content.scrollHeight).toBe(content.clientHeight);
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("dialog", { name: "サイドバー" })).toBeNull(),
    );
  },
};

export const HistoryNavigation: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = getPageScroller();
    await waitFor(() =>
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight + 400),
    );
    content.scrollTop = 400;
    await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
    await waitFor(() => expect(canvas.getByText("別のページ")).toBeVisible());
    await expect(getPageScroller().scrollTop).toBe(0);

    await userEvent.click(
      canvas.getByRole("button", { name: "サイドバーを開く" }),
    );
    // 開いている modal の外側から発生するブラウザの履歴移動を再現する。
    canvas.getByRole("button", { name: "戻る", hidden: true }).click();
    await waitFor(() =>
      expect(canvas.queryByRole("dialog", { name: "サイドバー" })).toBeNull(),
    );
    await waitFor(() => expect(getPageScroller().scrollTop).toBe(400));

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
    await expect(getPageScroller().scrollTop).toBe(400);

    await userEvent.click(canvas.getByRole("button", { name: "進む" }));
    await waitFor(() => expect(canvas.getByText("別のページ")).toBeVisible());
    await expect(getPageScroller().scrollTop).toBe(0);
  },
};
