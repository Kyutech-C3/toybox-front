import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { authenticateWithCode, getLoginUrl, refreshAccessToken } from "../auth";
import { consumeLoginCallback, recordLoginCallback } from "../loginCallback";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import AuthSessionProvider from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { fetchDataWithAuth } from "@/util/fetchData";

import type { Meta, StoryObj } from "@storybook/react";

const SessionContent = () => {
  const location = useLocation();
  return (
    <>
      <p>ログイン確認完了</p>
      <p>{location.pathname + location.search}</p>
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
          <Story />
        </ToastProvider>
      </MemoryRouter>
    ),
  ],
  args: { children: <SessionContent /> },
  beforeEach: () => {
    sessionStorage.removeItem("toybox-pending-login");
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
      if (status === 200) {
        return Response.json({ access_token: "storybook-refreshed-token" });
      }
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

export const UnsolicitedCode: Story = {
  parameters: { initialEntries: ["/?code=unsolicited-code"] },
  beforeEach: () => mockRefresh(200),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("ログイン確認完了")).toBeVisible();
    await expect(canvas.getByText("/?code=unsolicited-code")).toBeVisible();
    await expect(window.fetch).toHaveBeenCalledTimes(1);
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { method: "POST", credentials: "include" },
    );
  },
};

export const CodeOnUnrelatedPath: Story = {
  ...UnsolicitedCode,
  parameters: { initialEntries: ["/works/123?code=unsolicited-code"] },
  beforeEach: () => {
    recordLoginCallback();
    return mockRefresh(200);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("ログイン確認完了")).toBeVisible();
    await expect(
      canvas.getByText("/works/123?code=unsolicited-code"),
    ).toBeVisible();
    await expect(window.fetch).toHaveBeenCalledTimes(1);
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { method: "POST", credentials: "include" },
    );
  },
};

export const ExpectedCallback: Story = {
  parameters: {
    initialEntries: ["/auth/callback?code=valid-code"],
  },
  beforeEach: () => {
    recordLoginCallback();
    const originalFetch = window.fetch;
    window.fetch = fn().mockResolvedValue(
      Response.json({ access_token: "callback-token" }),
    );
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("ログイン確認完了")).toBeVisible();
    await expect(canvas.getByText("/")).toBeVisible();
    await expect(window.fetch).toHaveBeenCalledTimes(1);
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/discord\/callback\?code=valid-code$/),
      { credentials: "include" },
    );
    await expect(useAuthStore.getState().accessToken).toBe("callback-token");
    await expect(
      consumeLoginCallback("/auth/callback", "?code=valid-code"),
    ).toBeNull();
  },
};

export const FailedCallbackRestoresSession: Story = {
  parameters: { initialEntries: ["/auth/callback?code=invalid-code"] },
  beforeEach: () => {
    recordLoginCallback();
    return mockRefresh(500);
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("ログイン確認完了"),
    ).toBeVisible();
    await expect(useAuthStore.getState().accessToken).toBe(
      "storybook-refreshed-token",
    );
    await expect(window.fetch).toHaveBeenCalledTimes(2);
    await expect(window.fetch).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { method: "POST", credentials: "include" },
    );
  },
};

export const FailedCallbackPreservesSession: Story = {
  beforeEach: () => {
    useAuthStore.setState({
      accessToken: "existing-token",
      isInitialized: true,
    });
    useUserStore
      .getState()
      .setUser({ id: "existing-user", display_name: "テスト", icon_url: "" });
    return mockRefresh(500);
  },
  play: async () => {
    const sessionVersion = useAuthStore.getState().sessionVersion;
    await expect(authenticateWithCode("invalid-code")).rejects.toThrow();
    await expect(useAuthStore.getState().accessToken).toBe("existing-token");
    await expect(useAuthStore.getState().sessionVersion).toBe(sessionVersion);
    await expect(useUserStore.getState().user?.id).toBe("existing-user");
  },
};

export const CallbackExpiry: Story = {
  beforeEach: () => useAuthStore.setState({ isInitialized: true }),
  play: async () => {
    const originalFetch = window.fetch;
    const redirectURI = `${window.location.origin}/auth/callback`;
    window.fetch = fn().mockImplementation(async () =>
      Response.json({
        url: `https://discord.com/oauth2/authorize?redirect_uri=${encodeURIComponent(redirectURI)}`,
      }),
    );
    try {
      await getLoginUrl();
      await expect(
        consumeLoginCallback("/works/123", "?code=wrong-path"),
      ).toBeNull();
      await expect(
        consumeLoginCallback("/auth/callback", "?code=valid-code"),
      ).toEqual({ code: "valid-code" });
      await expect(
        consumeLoginCallback("/auth/callback", "?code=replay"),
      ).toBeNull();
      sessionStorage.setItem(
        "toybox-pending-login",
        JSON.stringify({
          startedAt: Date.now() - 11 * 60 * 1000,
        }),
      );
      await expect(
        consumeLoginCallback("/auth/callback", "?code=expired"),
      ).toBeNull();
      await getLoginUrl();
      await expect(
        consumeLoginCallback("/auth/callback", "?code=one&code=two"),
      ).toBeNull();
    } finally {
      window.fetch = originalFetch;
    }
  },
};

export const CodeOnRootPath: Story = {
  parameters: { initialEntries: ["/?code=valid-code"] },
  beforeEach: () => {
    recordLoginCallback();
    return mockRefresh(200);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("ログイン確認完了")).toBeVisible();
    await expect(canvas.getByText("/?code=valid-code")).toBeVisible();
    await expect(window.fetch).toHaveBeenCalledTimes(1);
    await expect(window.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { method: "POST", credentials: "include" },
    );
  },
};

export const FailedCallbackKeepsCurrentUser: Story = {
  parameters: { initialEntries: ["/auth/callback?code=invalid-code"] },
  beforeEach: () => {
    useAuthStore.setState({
      accessToken: "existing-token",
      isInitialized: false,
    });
    useUserStore.getState().setUser({
      id: "existing-user",
      display_name: "テスト",
      icon_url: "",
    });
    recordLoginCallback();
    return mockRefresh(400);
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("ログイン確認完了"),
    ).toBeVisible();
    await expect(useAuthStore.getState().accessToken).toBe("existing-token");
    await expect(useUserStore.getState().user?.id).toBe("existing-user");
    await expect(window.fetch).toHaveBeenCalledTimes(1);
  },
};
