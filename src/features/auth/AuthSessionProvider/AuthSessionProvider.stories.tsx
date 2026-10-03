import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { refreshAccessToken } from "../auth";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import AuthSessionProvider from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { fetchDataWithAuth } from "@/util/fetchData";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Auth/AuthSessionProvider",
  component: AuthSessionProvider,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </MemoryRouter>
    ),
  ],
  args: { children: <p>ログイン確認完了</p> },
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null, isInitialized: false });
    useUserStore.getState().clearUser();
  },
} satisfies Meta<typeof AuthSessionProvider>;

export default META;
type Story = StoryObj<typeof META>;

const mockRefresh = (status: number | null) => {
  const originalFetch = window.fetch;
  window.fetch = fn()
    .mockImplementationOnce(async () => {
      if (status === null) throw new TypeError("Network unavailable");
      return new Response(null, { status });
    })
    .mockResolvedValue(
      Response.json({ access_token: "storybook-refreshed-token" }),
    );
  return () => {
    window.fetch = originalFetch;
  };
};

export const ServerErrorRetry: Story = {
  beforeEach: () => mockRefresh(500),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("ログイン状態を確認できませんでした"),
    ).toBeVisible();
    await expect(useAuthStore.getState().isInitialized).toBe(false);
    await userEvent.click(canvas.getByRole("button", { name: "再試行" }));
    await expect(await canvas.findByText("ログイン確認完了")).toBeVisible();
    await expect(useAuthStore.getState().accessToken).toBe(
      "storybook-refreshed-token",
    );
  },
};

export const NetworkErrorRetry: Story = {
  ...ServerErrorRetry,
  beforeEach: () => mockRefresh(null),
};

export const NoSession: Story = {
  beforeEach: () => mockRefresh(400),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("ログイン確認完了"),
    ).toBeVisible();
    await expect(useAuthStore.getState().accessToken).toBeNull();
  },
};

export const RequestRecovery: Story = {
  beforeEach: () => {
    useAuthStore.setState({
      accessToken: "storybook-expired-token",
      isInitialized: true,
    });
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
      .mockResolvedValueOnce(Response.json({ access_token: "new-token" }))
      .mockResolvedValueOnce(Response.json({ id: "result" }));
    window.fetch = mockFetch;
    try {
      await expect(
        fetchDataWithAuth("/auth/users/me", "storybook-expired-token"),
      ).rejects.toMatchObject({ status: 500 });
      await expect(
        fetchDataWithAuth("/auth/users/me", "storybook-expired-token"),
      ).rejects.toMatchObject({ status: null });
      await expect(useAuthStore.getState().accessToken).toBe(
        "storybook-expired-token",
      );
      await expect(useAuthStore.getState().sessionVersion).toBe(
        initialSessionVersion,
      );
      await expect(useUserStore.getState().user?.id).toBe("storybook-user");
      await expect(
        fetchDataWithAuth("/auth/users/me", "storybook-expired-token"),
      ).resolves.toEqual({ id: "result" });
      await expect(mockFetch.mock.calls[6]?.[1]?.headers).toMatchObject({
        Authorization: "Bearer new-token",
      });
      // 明確な失効だけは認証情報を破棄する。
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 400 }));
      await expect(refreshAccessToken()).rejects.toMatchObject({ status: 400 });
      await expect(useAuthStore.getState().accessToken).toBeNull();
      await expect(useUserStore.getState().user).toBeNull();
    } finally {
      window.fetch = originalFetch;
    }
  },
};

export const SharedRefresh: Story = {
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "old-token", isInitialized: true });
  },
  play: async () => {
    const originalFetch = window.fetch;
    const mockFetch = fn().mockResolvedValue(
      Response.json({ access_token: "new-token" }),
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
      const firstRequest = refreshAccessToken();
      const secondRequest = refreshAccessToken();
      await expect(firstRequest).toBe(secondRequest);
      await waitFor(async () => {
        const locks = await navigator.locks.query();
        await expect(
          locks.pending?.some((lock) => lock.name === "toybox-auth-refresh"),
        ).toBe(true);
      });
      await expect(mockFetch).not.toHaveBeenCalled();
      releaseLock();
      await expect(firstRequest).resolves.toBe("new-token");
      await expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      releaseLock();
      await pendingLock;
      window.fetch = originalFetch;
    }
  },
};
