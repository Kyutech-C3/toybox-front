import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, within } from "storybook/test";
import { SWRConfig, unstable_serialize } from "swr";

import NotFoundPage from "./NotFoundPage";
import TopPage from "./TopPage";
import UserPage from "./UserPage";
import WorkPage from "./WorkPage";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { useWorkPageSizeStore } from "@/shared/ui/WorkCardGrid/store/useWorkPageSizeStore";
import { createWork } from "@/stories/fixtures";

import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

const WORK = createWork({
  id: "work-1",
  title: "Storybookで確認する作品",
  description: "# 作品説明\n\n画面全体の表示を確認するための固定データです。",
  thumbnail_url: "/comingSoonHo-Oh.webp",
  tags: [
    {
      id: "tag-react",
      name: "React",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
});

const PROFILE = {
  id: "owner",
  display_name: "作者",
  profile: "電子工作とWeb開発をしています。",
  avatar_url: "/comingSoonLugia.webp",
  github_id: "toybox-user",
  twitter_id: "toybox_user",
};

type PageFrameProps = {
  path: string;
  routePattern?: string;
  fallback: Record<string, unknown>;
  children: ReactNode;
};

const PageFrame = ({
  path,
  routePattern = path,
  fallback,
  children,
}: PageFrameProps) => (
  <MemoryRouter initialEntries={[path]}>
    <ToastProvider>
      <SWRConfig value={{ fallback, provider: () => new Map() }}>
        <Routes>
          <Route path={routePattern} element={children} />
        </Routes>
      </SWRConfig>
    </ToastProvider>
  </MemoryRouter>
);

const PageCatalog = () => <TopPage />;

const META = {
  title: "Pages",
  component: PageCatalog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null });
    useUserStore.getState().clearUser();
    useWorkPageSizeStore.setState({ pageSize: 30 });
  },
} satisfies Meta<typeof PageCatalog>;

export default META;
type Story = StoryObj<typeof META>;

export const Top: Story = {
  render: () => (
    <PageFrame
      path="/"
      fallback={{
        "/tags": {
          tags: WORK.tags.map((tag) => ({ ...tag, work_count: 1 })),
        },
        "/works?page=1&limit=30": {
          works: [WORK],
          total_count: 1,
          page: 1,
          limit: 30,
        },
      }}
    >
      <TopPage />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", {
        name: "Storybookで確認する作品",
      }),
    ).toBeVisible();
  },
};

export const WorkDetail: Story = {
  render: () => (
    <PageFrame
      path="/works/work-1"
      routePattern="/works/:id"
      fallback={{
        "/works/work-1": WORK,
        "/works/work-1/comments": [],
      }}
    >
      <WorkPage />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Storybookで確認する作品" }),
    ).toBeVisible();
    await expect(canvas.getByText("まだコメントはありません。")).toBeVisible();
  },
};

export const UserPortfolio: Story = {
  render: () => (
    <PageFrame
      path="/users/owner"
      routePattern="/users/:id"
      fallback={{
        [unstable_serialize([
          "/users/owner",
          "/works/users/owner?page=1&limit=30",
          null,
        ])]: {
          userProfile: PROFILE,
          worksResponse: { works: [WORK], total_count: 1, page: 1, limit: 30 },
        },
      }}
    >
      <UserPage />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", { name: "作者" }),
    ).toBeVisible();
  },
};

export const NotFound: Story = {
  render: () => (
    <PageFrame path="/missing" routePattern="*" fallback={{}}>
      <NotFoundPage />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      "ページが見つかりません",
    );
  },
};
