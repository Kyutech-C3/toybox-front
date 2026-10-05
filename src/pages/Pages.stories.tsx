import { act } from "react";
import {
  createMemoryRouter,
  Link,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { SWRConfig, unstable_serialize } from "swr";

import EditPage from "./EditPage";
import NotFoundPage from "./NotFoundPage";
import TopPage from "./TopPage";
import UserPage from "./UserPage";
import WorkPage from "./WorkPage";

import App from "@/App";
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
  thumbnail_url: "",
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
  avatar_url: "",
  github_id: "toybox-user",
  x_username: "toybox_user",
};

const expectPageMetadata = async (title: string, description?: string) => {
  await waitFor(() => {
    expect(document.title).toBe(`${title} | ToyBox`);
    // Vitest自身のタイトルを除き、アプリのタイトルの重複を検査する。
    const titles = Array.from(document.head.querySelectorAll("title")).filter(
      (element) => element.textContent?.endsWith("ToyBox"),
    );
    expect(titles).toHaveLength(1);
    const descriptions = document.head.querySelectorAll(
      'meta[name="description"]',
    );
    expect(descriptions).toHaveLength(1);
    if (description !== undefined) {
      expect(descriptions[0]).toHaveAttribute("content", description);
    }
  });
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
      <SWRConfig
        value={{
          fallback,
          provider: () => new Map(),
          suspense: true,
          revalidateOnMount: false,
          shouldRetryOnError: false,
        }}
      >
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
    await expectPageMetadata("作品一覧");
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
    await expectPageMetadata(
      WORK.title,
      "作品説明 画面全体の表示を確認するための固定データです。",
    );
  },
};

export const WorkEdit: Story = {
  render: () => {
    const router = createMemoryRouter(
      [
        {
          path: "/edit/new",
          element: (
            <ToastProvider>
              <SWRConfig
                value={{
                  fallback: {
                    [unstable_serialize(["/tags", "storybook-token"])]: {
                      tags: [],
                    },
                  },
                  provider: () => new Map(),
                }}
              >
                <EditPage isNewWork />
              </SWRConfig>
            </ToastProvider>
          ),
        },
      ],
      { initialEntries: ["/edit/new"] },
    );
    return <RouterProvider router={router} />;
  },
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "storybook-token" });
    useUserStore.setState({
      user: { id: "owner", display_name: "作者", icon_url: "" },
      hasLoadFailed: false,
    });
    const originalFetch = window.fetch;
    window.fetch = fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).endsWith("/auth/users/me")
        ? Response.json({ id: "owner", display_name: "作者", icon_url: "" })
        : originalFetch(input, init),
    );
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "タイトル" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expectPageMetadata("作品を投稿");
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
    await expectPageMetadata("作者の作品", PROFILE.profile);
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
    await expectPageMetadata("ページが見つかりません");
  },
};

let completeWorkRequest: ((response: Response) => void) | undefined;

const finishWorkRequest = (response: Response) => {
  if (!completeWorkRequest) throw new Error("No pending work request");
  completeWorkRequest(response);
  completeWorkRequest = undefined;
};

export const MetadataNavigationAndRetry: Story = {
  beforeEach: () => {
    const originalFetch = window.fetch;
    completeWorkRequest = undefined;
    window.fetch = fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/works/work-2")) {
        return new Promise<Response>((resolve) => {
          completeWorkRequest = resolve;
        });
      }
      throw new Error(`Unexpected request: ${input}`);
    });
    return () => {
      window.fetch = originalFetch;
      completeWorkRequest = undefined;
    };
  },
  render: () => (
    <PageFrame
      path="/works/work-1"
      routePattern="*"
      fallback={{
        "/works/work-1": WORK,
        "/works/work-1/comments": [],
        "/works/work-2/comments": [],
      }}
    >
      <nav aria-label="検証用のページ移動">
        <Link to="/works/work-1">最初の作品</Link>
        <Link to="/works/work-2">次の作品</Link>
        <Link to="/missing">存在しないページ</Link>
        <Link to="/edit/new">投稿ページ</Link>
      </nav>
      <App />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectPageMetadata(WORK.title);
    await act(async () => {
      await userEvent.click(canvas.getByRole("link", { name: "次の作品" }));
    });
    await expectPageMetadata("読み込み中", "ページを読み込んでいます。");
    await waitFor(() => expect(completeWorkRequest).toBeDefined());
    await act(async () => {
      finishWorkRequest(new Response(null, { status: 404 }));
    });
    await expectPageMetadata("作品が見つかりません", "作品が見つかりません");

    await act(async () => {
      await userEvent.click(canvas.getByRole("button", { name: "再試行" }));
    });
    await waitFor(() => expect(completeWorkRequest).toBeDefined());
    await act(async () => {
      finishWorkRequest(
        Response.json({
          ...WORK,
          id: "work-2",
          title: "次の作品",
          description:
            "# 次の作品\n\n**説明**と[リンク](https://example.com)です。",
        }),
      );
    });
    await expectPageMetadata("次の作品", "次の作品 説明とリンクです。");

    await userEvent.click(canvas.getByRole("link", { name: "最初の作品" }));
    await expectPageMetadata(WORK.title);
    await userEvent.click(
      canvas.getByRole("link", { name: "存在しないページ" }),
    );
    await expectPageMetadata("ページが見つかりません");
    await userEvent.click(canvas.getByRole("link", { name: "投稿ページ" }));
    await expectPageMetadata(
      "ログインが必要です",
      "作品を投稿・編集するにはログインしてください。",
    );
  },
};

export const CommentErrorKeepsWorkMetadata: Story = {
  beforeEach: () => {
    const originalFetch = window.fetch;
    window.fetch = fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/works/work-1/comments")) {
        return new Response(null, { status: 500 });
      }
      throw new Error(`Unexpected request: ${input}`);
    });
    return () => {
      window.fetch = originalFetch;
    };
  },
  render: () => (
    <PageFrame
      path="/works/work-1"
      routePattern="/works/:id"
      fallback={{ "/works/work-1": WORK }}
    >
      <WorkPage />
    </PageFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "サーバーで問題が発生しました",
    );
    await expectPageMetadata(WORK.title);
  },
};
