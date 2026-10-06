import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import Header from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Header",
  component: Header,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ToastProvider>
          <Story />
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
} satisfies Meta<typeof Header>;

export default META;
type Story = StoryObj<typeof META>;

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "logo-image" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "ログイン" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "ログイン状態の確認を再試行" }),
    ).not.toBeInTheDocument();

    const lightBackground = getComputedStyle(document.body).backgroundColor;
    await userEvent.click(
      canvas.getByRole("button", { name: "ダークモードに切り替え" }),
    );
    await expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await expect(
      canvas.getByRole("button", { name: "ライトモードに切り替え" }),
    ).toBeVisible();
    expect(getComputedStyle(document.body).backgroundColor).not.toBe(
      lightBackground,
    );
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { docs: { story: { inline: false } } },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await expect(
      within(canvasElement).getByRole("button", {
        name: "ライトモードに切り替え",
      }),
    ).toBeVisible();
  },
};

export const RestoreRetryFailure: Story = {
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null, hasRestoreFailed: true });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalFetch = window.fetch;
    let completeRequest = (_response: Response) => {};
    const responsePromise = new Promise<Response>((resolve) => {
      completeRequest = resolve;
    });
    const mockFetch = fn().mockReturnValue(responsePromise);
    window.fetch = mockFetch;
    try {
      const retryButton = canvas.getByRole("button", {
        name: "ログイン状態の確認を再試行",
      });
      await userEvent.click(retryButton);
      await expect(retryButton).toBeDisabled();
      await expect(retryButton).toHaveAttribute("aria-busy", "true");
      await expect(
        canvas.getByRole("button", { name: "ログイン" }),
      ).toBeDisabled();
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      completeRequest(new Response(null, { status: 500 }));
      await waitFor(() =>
        expect(
          canvas.getByText(
            "ログイン状態を確認できませんでした。再試行してください。",
          ),
        ).toBeVisible(),
      );
      await expect(retryButton).toBeEnabled();
      await expect(useAuthStore.getState().hasRestoreFailed).toBe(true);
    } finally {
      completeRequest(new Response(null, { status: 500 }));
      window.fetch = originalFetch;
    }
  },
};

export const RestoreRetryNoSession: Story = {
  beforeEach: () => {
    useAuthStore.setState({ accessToken: null, hasRestoreFailed: true });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalFetch = window.fetch;
    window.fetch = fn().mockResolvedValue(new Response(null, { status: 400 }));
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "ログイン状態の確認を再試行" }),
      );
      await waitFor(() =>
        expect(canvas.getByText("ログインしていません")).toBeVisible(),
      );
      await expect(useAuthStore.getState().hasRestoreFailed).toBe(false);
      await expect(
        canvas.queryByRole("button", { name: "ログイン状態の確認を再試行" }),
      ).not.toBeInTheDocument();
    } finally {
      window.fetch = originalFetch;
    }
  },
};
