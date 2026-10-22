import { useEffect, useLayoutEffect, useState } from "react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";

import AppLayout from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import MarkdownPreview from "@/features/MarkdownPreview";
import useUnsavedChangesGuard from "@/features/WorkEditor/hook/useUnsavedChangesGuard";
import { useWorkEditorStoreApi } from "@/features/WorkEditor/store/useWorkEditorStore";
import WorkEditorStoreProvider from "@/features/WorkEditor/store/WorkEditorStoreProvider";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { getPageScroller, lockPageScroll } from "@/util/pageScroll";

import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import type { DataRouter } from "react-router-dom";

import "@/App.css";

const HomeContent = () => (
  <div style={{ minHeight: 1600, paddingTop: 500, boxSizing: "border-box" }}>
    <Link to="/other">別のページへ</Link>
    <Link to="/edit/new">未保存の編集へ</Link>
    <MarkdownPreview content="![画像](/favicon-192.png)" />
    <p>スクロールする本文</p>
  </div>
);

const OtherContent = () => <p>別のページ</p>;

const UnsavedPage = () => {
  const navigate = useNavigate();
  const store = useWorkEditorStoreApi();
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  useUnsavedChangesGuard();
  useEffect(() => {
    const state = store.getState();
    state.initializeForNew();
    state.setTitle("保存していない作品");
  }, [store]);
  useLayoutEffect(() => {
    if (!isScrollLocked) return;
    return lockPageScroll();
  }, [isScrollLocked]);
  return (
    <>
      <p>保存していない作品</p>
      <button type="button" onClick={() => navigate(-1)}>
        戻る
      </button>
      <button type="button" onClick={() => setIsScrollLocked(false)}>
        スクロールロックを解除
      </button>
    </>
  );
};

type AppLayoutPreviewProps = {
  children: ReactNode;
};

const AppLayoutPreview = ({ children }: AppLayoutPreviewProps) => {
  const [router] = useState<DataRouter>(() => {
    const router = createMemoryRouter([
      {
        element: <ToastProvider>{children}</ToastProvider>,
        children: [
          {
            path: "/",
            element: <HomeContent />,
          },
          { path: "/other", element: <OtherContent /> },
          {
            path: "/edit/new",
            element: (
              <WorkEditorStoreProvider>
                <UnsavedPage />
              </WorkEditorStoreProvider>
            ),
          },
        ],
      },
    ]);
    return router;
  });
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

export const CanceledNavigation: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const confirm = spyOn(window, "confirm").mockReturnValue(false);
    try {
      await userEvent.click(
        await canvas.findByRole("link", { name: "未保存の編集へ" }),
      );
      await waitFor(() =>
        expect(document.documentElement).toHaveAttribute(
          "data-scroll-locked",
          "true",
        ),
      );
      // 履歴イベントの発生だけではロックを解除しない。
      window.dispatchEvent(new PopStateEvent("popstate"));
      canvas.getByRole("button", { name: "戻る", hidden: true }).click();
      await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
      await expect(canvas.getByText("保存していない作品")).toBeVisible();
      await expect(document.documentElement).toHaveAttribute(
        "data-scroll-locked",
        "true",
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "スクロールロックを解除" }),
      );
      await waitFor(() =>
        expect(document.documentElement).not.toHaveAttribute(
          "data-scroll-locked",
        ),
      );
    } finally {
      confirm.mockRestore();
    }
  },
};
