import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { SWRConfig, unstable_serialize } from "swr";

import EditPage from "./EditPage";
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

const expectPageCanonical = async (path?: string) => {
  await waitFor(() => {
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(path ? 1 : 0);
    if (path) {
      expect(links[0]).toHaveAttribute(
        "href",
        `https://toybox.compositecomputer.club${path}`,
      );
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
}: PageFrameProps) => {
  const router = createMemoryRouter(
    [
      {
        path: routePattern,
        element: (
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
              {children}
            </SWRConfig>
          </ToastProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  return <RouterProvider router={router} />;
};

const PageCatalog = () => <TopPage />;

type EditPageFrameProps = {
  path: string;
  isNewWork?: boolean;
};

const EditPageFrame = ({ path, isNewWork = false }: EditPageFrameProps) => {
  const router = createMemoryRouter(
    [
      {
        path: isNewWork ? "/edit/new" : "/edit/:id",
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
                suspense: true,
              }}
            >
              <EditPage isNewWork={isNewWork} />
            </SWRConfig>
          </ToastProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  return <RouterProvider router={router} />;
};

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
};

export const WorkDetail: Story = {
  tags: ["test"],
  render: () => (
    <PageFrame
      path="/works/work-1?utm_source=story#description"
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
    await expectPageCanonical("/works/work-1");
  },
};

export const WorkEdit: Story = {
  render: () => <EditPageFrame path="/edit/new" isNewWork />,
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
};

export const WorkEditForbidden: Story = {
  tags: ["test"],
  render: () => <EditPageFrame path="/edit/work-1" />,
  beforeEach: () => {
    const viewer = {
      id: "viewer",
      display_name: "閲覧者",
      icon_url: "",
    };
    useAuthStore.setState({ accessToken: "storybook-token" });
    useUserStore.setState({ user: viewer, hasLoadFailed: false });
    const originalFetch = window.fetch;
    window.fetch = fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/auth/users/me"))
        return Response.json(viewer);
      if (String(input).endsWith("/works/work-1")) return Response.json(WORK);
      throw new Error(`Unexpected request: ${input}`);
    });
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "この作品は編集できません" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("textbox", { name: "タイトル" }),
    ).toBeNull();
    await expectPageMetadata(
      "この作品は編集できません",
      "編集できるのは作品を投稿した本人だけです。",
    );
    await expectPageCanonical();
  },
};

export const UserPortfolio: Story = {
  render: () => (
    <PageFrame
      path="/users/owner?page=1&utm_source=story#profile"
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
};

export const NotFound: Story = {
  render: () => (
    <PageFrame path="/missing" routePattern="*" fallback={{}}>
      <NotFoundPage />
    </PageFrame>
  ),
};

export const OwnerProfileEditing: Story = {
  tags: ["test"],
  render: () => (
    <PageFrame
      path="/users/owner"
      routePattern="/users/:id"
      fallback={{
        [unstable_serialize([
          "/users/owner",
          "/works/users/owner?page=1&limit=30",
          "storybook-token",
        ])]: {
          userProfile: PROFILE,
          worksResponse: { works: [WORK], total_count: 1, page: 1, limit: 30 },
        },
      }}
    >
      <UserPage />
    </PageFrame>
  ),
  beforeEach: () => {
    const originalFetch = globalThis.fetch;
    const user = { id: "owner", display_name: "作者", icon_url: "" };
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/users/me")
        ? Promise.resolve(new Response(JSON.stringify(user), { status: 200 }))
        : originalFetch(resource, init);
    useAuthStore.setState({ accessToken: "storybook-token" });
    useUserStore.setState({ user, hasLoadFailed: false });
    return () => {
      globalThis.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "作者" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "プロフィールを編集" }),
    );
    await expect(
      canvas.getByRole("button", { name: "アイコン画像をアップロード" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("img", { name: "作者のプロフィール画像" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "キャンセル" }));
    await expect(
      canvas.queryByRole("button", { name: "アイコン画像を編集" }),
    ).not.toBeInTheDocument();
  },
};
