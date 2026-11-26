import { StrictMode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import useSWR, { mutate } from "swr";

import AuthCallback from "../AuthCallback";
import { logout, refreshSession } from "../auth";
import { consumeLoginCallback, recordLoginCallback } from "../loginCallback";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import AuthSessionProvider from "./index";

import Header from "@/features/Header";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { fetchDataWithAuth } from "@/util/fetchData";

import type { Meta, StoryObj } from "@storybook/react";

const SessionContent = () => {
  const location = useLocation();
  return (
    <>
      <p>ログイン確認完了</p>
      <p>{location.pathname + location.search + location.hash}</p>
    </>
  );
};

const META = {
  title: "Features/Auth/AuthSessionProvider",
  component: AuthSessionProvider,
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ["/"]}>
        <ToastProvider>
          <StrictMode>
            <Story />
          </StrictMode>
        </ToastProvider>
      </MemoryRouter>
    ),
  ],
  args: {
    children: (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<SessionContent />} />
      </Routes>
    ),
  },
  beforeEach: () => {
    sessionStorage.removeItem("toybox-pending-login");
    useAuthStore.setState({
      isAuthenticated: false,
      isInitialized: false,
      hasRestoreFailed: false,
    });
    useUserStore.getState().clearUser();
  },
} satisfies Meta<typeof AuthSessionProvider>;

export default META;
type Story = StoryObj<typeof META>;

const mockRefresh = (status: number) => {
  const originalFetch = window.fetch;
  window.fetch = fn()
    .mockImplementationOnce(async () => new Response(null, { status }))
    .mockImplementation(async (input: RequestInfo | URL) =>
      String(input).endsWith("/auth/users/me")
        ? Response.json({
            id: "test-user",
            display_name: "テスト",
            icon_url: "",
          })
        : new Response(null, { status: 200 }),
    );
  return () => {
    window.fetch = originalFetch;
  };
};

export const ServerErrorRetry: Story = {
  tags: ["test"],
  args: {
    children: (
      <>
        <Header />
        <SessionContent />
      </>
    ),
  },
  beforeEach: () => mockRefresh(500),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const retryButton = await canvas.findByRole("button", {
      name: "ログイン状態の確認を再試行",
    });
    retryButton.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(useAuthStore.getState().hasRestoreFailed).toBe(false),
    );
    await expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await expect(
      canvas.queryByRole("button", { name: "ログイン状態の確認を再試行" }),
    ).not.toBeInTheDocument();
  },
};

export const NoSession: Story = {
  tags: ["test"],
  beforeEach: () => mockRefresh(400),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("ログイン確認完了"),
    ).toBeVisible();
    await expect(useAuthStore.getState().isAuthenticated).toBe(false);
    await expect(useAuthStore.getState().hasRestoreFailed).toBe(false);
  },
};

export const RequestRecovery: Story = {
  tags: ["test"],
  beforeEach: () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    useUserStore.getState().setUser({
      id: "storybook-user",
      display_name: "テストユーザー",
      icon_url: "",
    });
  },
  play: async () => {
    const originalFetch = window.fetch;
    const initialSessionVersion = useAuthStore.getState().sessionVersion;
    const mockFetch = fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new TypeError("Network unavailable"))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ id: "result" }));
    window.fetch = mockFetch;
    try {
      await expect(fetchDataWithAuth("/auth/users/me")).rejects.toMatchObject({
        status: 500,
      });
      await expect(fetchDataWithAuth("/auth/users/me")).rejects.toMatchObject({
        status: null,
      });
      await expect(useAuthStore.getState().isAuthenticated).toBe(true);
      await expect(useAuthStore.getState().sessionVersion).toBe(
        initialSessionVersion,
      );
      await expect(useUserStore.getState().user?.id).toBe("storybook-user");
      await expect(fetchDataWithAuth("/auth/users/me")).resolves.toEqual({
        id: "result",
      });
      await expect(mockFetch.mock.calls[6]?.[1]).toMatchObject({
        credentials: "include",
      });
      // 明確な失効だけは認証情報を破棄する。
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 400 }));
      await expect(refreshSession()).rejects.toMatchObject({ status: 400 });
      await expect(useAuthStore.getState().isAuthenticated).toBe(false);
      await expect(useUserStore.getState().user).toBeNull();
    } finally {
      window.fetch = originalFetch;
    }
  },
};

export const SharedRefresh: Story = {
  tags: ["test"],
  beforeEach: () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
  },
  play: async () => {
    const originalFetch = window.fetch;
    const mockFetch = fn().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    window.fetch = mockFetch;
    let releaseLock = () => {};
    const lockGate = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    let markLockHeld = () => {};
    const lockHeld = new Promise<void>((resolve) => {
      markLockHeld = resolve;
    });
    const pendingLock = navigator.locks.request("toybox-auth-refresh", () => {
      markLockHeld();
      return lockGate;
    });
    try {
      await lockHeld;
      const firstRequest = refreshSession();
      const secondRequest = refreshSession();
      await expect(firstRequest).toBe(secondRequest);
      await waitFor(async () => {
        const locks = await navigator.locks.query();
        await expect(
          locks.pending?.some((lock) => lock.name === "toybox-auth-refresh"),
        ).toBe(true);
      });
      await expect(mockFetch).not.toHaveBeenCalled();
      releaseLock();
      await expect(firstRequest).resolves.toBeUndefined();
      await expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      releaseLock();
      await pendingLock;
      window.fetch = originalFetch;
    }
  },
};

const LogoutCacheContent = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data } = useSWR(
    isAuthenticated ? ["/logout-private-data", true] : null,
    () => ({ title: "非公開の作品" }),
    { suspense: false },
  );
  return <p>{data?.title ?? "未認証"}</p>;
};

export const LogoutSessionCleanup: Story = {
  tags: ["test"],
  args: { children: <LogoutCacheContent /> },
  beforeEach: () => useAuthStore.setState({ isInitialized: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalFetch = window.fetch;
    const privateKey = ["/logout-private-data", true];
    useAuthStore.getState().startSession();
    useUserStore
      .getState()
      .setUser({ id: "storybook-user", display_name: "テスト", icon_url: "" });
    await expect(await canvas.findByText("非公開の作品")).toBeVisible();
    let completeRequest = (_response: Response) => {};
    window.fetch = fn(
      () =>
        new Promise<Response>((resolve) => {
          completeRequest = resolve;
        }),
    );
    let request: Promise<void> | undefined;
    try {
      request = logout();
      await expect(useAuthStore.getState().isAuthenticated).toBe(false);
      await expect(useUserStore.getState().user).toBeNull();
      await expect(mutate(privateKey)).resolves.toBeUndefined();
      await expect(await canvas.findByText("未認証")).toBeVisible();
    } finally {
      completeRequest(new Response(null, { status: 200 }));
      await request;
      window.fetch = originalFetch;
    }
  },
};

export const ExpectedCallback: Story = {
  tags: ["test"],
  parameters: {
    initialEntries: ["/auth/callback?code=valid-code"],
  },
  beforeEach: () => {
    recordLoginCallback("/works/123?view=detail#comments");
    const originalFetch = window.fetch;
    window.fetch = fn(async () => new Response(null, { status: 200 }));
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("/works/123?view=detail#comments"),
    ).toBeVisible();
    await expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await expect(sessionStorage.getItem("toybox-pending-login")).toBeNull();
  },
};

export const CancelledLoginReturnsToOriginalPage: Story = {
  tags: ["test"],
  parameters: { initialEntries: ["/auth/callback?error=access_denied"] },
  beforeEach: () => {
    recordLoginCallback("/edit/new?mode=markdown#description");
    return mockRefresh(200);
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        "/edit/new?mode=markdown#description",
      ),
    ).toBeVisible();
    await expect(sessionStorage.getItem("toybox-pending-login")).toBeNull();
  },
};

export const SafeReturnPaths: Story = {
  tags: ["test"],
  beforeEach: () => useAuthStore.setState({ isInitialized: true }),
  play: async () => {
    for (const returnTo of [
      "https://example.com/",
      "//example.com/",
      "/.//example.com/",
      "/\\example.com/",
      "/auth/callback?code=loop",
      "/works/../auth/callback",
      "/\n/example.com/",
    ]) {
      recordLoginCallback(returnTo);
      await expect(
        consumeLoginCallback("/auth/callback", "?code=valid-code"),
      ).toEqual({ code: "valid-code", returnTo: "/" });
    }
    // 保存データも、読み取り時に改めて検証する。
    sessionStorage.setItem(
      "toybox-pending-login",
      JSON.stringify({ startedAt: Date.now(), returnTo: "//example.com/" }),
    );
    await expect(
      consumeLoginCallback("/auth/callback", "?code=valid-code"),
    ).toEqual({ code: "valid-code", returnTo: "/" });
  },
};
