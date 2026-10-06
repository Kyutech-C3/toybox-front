import { StrictMode } from "react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import useSWR, { mutate } from "swr";

import ProfileEditor from "./index";

import { clearAuthSession } from "@/features/auth/auth";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";
import type { UserPortfolioSWRKey } from "../hook/useUserPortfolio";

const PROFILE = {
  id: "user-1",
  display_name: "Toybox User",
  profile: "電子工作とWeb開発をしています。",
  avatar_url: "",
  github_id: "toybox-user",
  x_username: "toybox_user",
};

const ProfileNavigation = () => {
  const navigate = useNavigate();
  return (
    <>
      <Link to="/other">別のページへ</Link>
      <Button onClick={() => navigate(-1)}>前のページへ</Button>
    </>
  );
};

const META = {
  title: "Features/UserPortfolio/ProfileEditor",
  component: ProfileEditor,
  decorators: [
    (Story) => {
      const router = createMemoryRouter(
        [
          {
            path: "/profile",
            element: (
              <div style={{ width: "min(640px, 100%)" }}>
                <Story />
                <ProfileNavigation />
              </div>
            ),
          },
          { path: "/other", element: <h1>移動先のページ</h1> },
        ],
        { initialEntries: ["/other", "/profile"], initialIndex: 1 },
      );
      return (
        <ToastProvider>
          <StrictMode>
            <RouterProvider router={router} />
          </StrictMode>
        </ToastProvider>
      );
    },
  ],
  tags: ["autodocs"],
  args: {
    userProfile: PROFILE,
    userPortfolioSWRKey: [
      "/users/user-1",
      "/works/users/user-1?page=1&limit=30",
      null,
    ],
    onClose: () => undefined,
  },
} satisfies Meta<typeof ProfileEditor>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

type SaveRevalidationProps = {
  swrKey: UserPortfolioSWRKey;
  onRevalidate: () => Promise<null>;
};

const SaveRevalidation = ({ swrKey, onRevalidate }: SaveRevalidationProps) => {
  useSWR(swrKey, onRevalidate, {
    suspense: false,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return null;
};

type SaveLifecycleParams = {
  boundary: "save" | "revalidation";
  interruption?: "logout" | "session" | "unmount";
  hasSaveError?: boolean;
};

const createSaveLifecycleStory = ({
  boundary,
  interruption,
  hasSaveError = false,
}: SaveLifecycleParams): Story => {
  const swrKey: UserPortfolioSWRKey = [
    `/profile-save-${boundary}-${interruption ?? "current"}-${hasSaveError}`,
    "/profile-save-works",
    "storybook-profile-token",
  ];
  const onClose = fn();
  const revalidate = fn<() => Promise<null>>();
  let completeSave = (_response: Response) => {};
  let completeRevalidation = () => {};

  return {
    args: { userPortfolioSWRKey: swrKey, onClose },
    render: (args) => (
      <>
        <SaveRevalidation swrKey={swrKey} onRevalidate={revalidate} />
        <ProfileEditor {...args} />
      </>
    ),
    beforeEach: () => {
      const originalFetch = window.fetch;
      const originalAuth = useAuthStore.getState();
      const originalUser = useUserStore.getState();
      useAuthStore.getState().startSession("storybook-profile-token");
      useUserStore.getState().setUser({
        id: PROFILE.id,
        display_name: PROFILE.display_name,
        icon_url: "",
      });
      onClose.mockClear();
      const pendingSave = new Promise<Response>((resolve) => {
        completeSave = resolve;
      });
      const pendingRevalidation = new Promise<null>((resolve) => {
        completeRevalidation = () => resolve(null);
      });
      revalidate.mockReset().mockReturnValue(pendingRevalidation);
      window.fetch = fn((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).endsWith("/auth/users") && init?.method === "PATCH"
          ? pendingSave
          : originalFetch(input, init),
      );
      return async () => {
        completeSave(Response.json(PROFILE));
        completeRevalidation();
        window.fetch = originalFetch;
        await mutate(swrKey, undefined, { revalidate: false });
        useAuthStore.setState(originalAuth);
        useUserStore.setState(originalUser);
      };
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.type(
        canvas.getByRole("textbox", { name: "表示名" }),
        "変更",
      );
      await userEvent.click(canvas.getByRole("button", { name: "保存" }));
      await expect(
        canvas.getByRole("button", { name: "保存中..." }),
      ).toBeDisabled();

      if (boundary === "revalidation") {
        completeSave(Response.json(PROFILE));
        await waitFor(() => expect(revalidate).toHaveBeenCalledTimes(1));
      }

      if (interruption === "logout" || interruption === "session") {
        await clearAuthSession();
        if (interruption === "session") {
          // 同じトークン・ユーザーでも、新しいログインの結果は上書きしない。
          useAuthStore.getState().startSession("storybook-profile-token");
          useUserStore.getState().setUser({
            id: PROFILE.id,
            display_name: "再ログイン後の名前",
            icon_url: "",
          });
        }
      } else if (interruption === "unmount") {
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        try {
          await userEvent.click(
            canvas.getByRole("link", { name: "別のページへ" }),
          );
          await expect(
            await canvas.findByRole("heading", { name: "移動先のページ" }),
          ).toBeVisible();
        } finally {
          window.confirm = originalConfirm;
        }
      } else {
        // 同一セッションのtoken更新や最新のユーザー情報は維持する。
        useAuthStore.getState().setAccessToken("storybook-refreshed-token");
        useUserStore.getState().setUser({
          id: PROFILE.id,
          display_name: PROFILE.display_name,
          icon_url: "/favicon.svg",
        });
      }

      if (boundary === "save") {
        completeSave(
          hasSaveError
            ? new Response(null, { status: 500 })
            : Response.json(PROFILE),
        );
      }
      if (!interruption && !hasSaveError) {
        await waitFor(() => expect(revalidate).toHaveBeenCalledTimes(1));
      }
      completeRevalidation();
      // 解放したPromiseから保存の完了処理までを次のtaskで待つ。
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

      if (interruption) {
        await expect(onClose).not.toHaveBeenCalled();
        await expect(
          body.queryByText("プロフィールを更新しました"),
        ).not.toBeInTheDocument();
        await expect(
          body.queryByText("プロフィールを更新できませんでした"),
        ).not.toBeInTheDocument();
        await expect(revalidate).toHaveBeenCalledTimes(
          boundary === "save" ? 0 : 1,
        );
        await expect(useUserStore.getState().user?.display_name ?? null).toBe(
          interruption === "logout"
            ? null
            : interruption === "session"
              ? "再ログイン後の名前"
              : PROFILE.display_name,
        );
        await expect(useAuthStore.getState().accessToken).toBe(
          interruption === "logout" ? null : "storybook-profile-token",
        );
      } else if (hasSaveError) {
        await waitFor(() =>
          expect(
            body.getByText("プロフィールを更新できませんでした"),
          ).toBeVisible(),
        );
        await expect(onClose).not.toHaveBeenCalled();
        await expect(revalidate).not.toHaveBeenCalled();
        await expect(
          canvas.getByRole("button", { name: "保存" }),
        ).toBeEnabled();
      } else {
        await waitFor(() =>
          expect(body.getByText("プロフィールを更新しました")).toBeVisible(),
        );
        await expect(onClose).toHaveBeenCalledTimes(1);
        await expect(useUserStore.getState().user).toEqual({
          id: PROFILE.id,
          display_name: `${PROFILE.display_name}変更`,
          icon_url: "/favicon.svg",
        });
        await expect(useAuthStore.getState().accessToken).toBe(
          "storybook-refreshed-token",
        );
      }
    },
  };
};

export const SaveProfile: Story = {
  ...createSaveLifecycleStory({ boundary: "save" }),
  tags: ["test"],
};
export const SaveFailure: Story = {
  ...createSaveLifecycleStory({ boundary: "save", hasSaveError: true }),
  tags: ["test"],
};
export const SaveAfterLogout: Story = {
  ...createSaveLifecycleStory({ boundary: "save", interruption: "logout" }),
  tags: ["test"],
};
export const RevalidationAfterLogout: Story = {
  ...createSaveLifecycleStory({
    boundary: "revalidation",
    interruption: "logout",
  }),
  tags: ["test"],
};
export const RevalidationAfterNewSession: Story = {
  ...createSaveLifecycleStory({
    boundary: "revalidation",
    interruption: "session",
  }),
  tags: ["test"],
};
export const SaveAfterUnmount: Story = {
  ...createSaveLifecycleStory({ boundary: "save", interruption: "unmount" }),
  tags: ["test"],
};
export const SaveFailureAfterUnmount: Story = {
  ...createSaveLifecycleStory({
    boundary: "save",
    interruption: "unmount",
    hasSaveError: true,
  }),
  tags: ["test"],
};

export const ValidationError: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const github = canvas.getByRole("textbox", { name: "GitHub" });
    await userEvent.clear(github);
    await userEvent.type(github, "invalid--name");
    await userEvent.tab();
    await expect(canvas.getByText("13/39")).toBeVisible();
    await expect(canvas.getByRole("alert")).toHaveTextContent("単独のハイフン");
    await expect(canvas.getByRole("button", { name: /保存/ })).toBeDisabled();
  },
};

const isUnloadPrevented = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

export const PreventLeavingWithChanges: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalConfirm = window.confirm;
    const confirm = fn(() => false);
    window.confirm = confirm;
    try {
      await expect(isUnloadPrevented()).toBe(false);
      for (const name of ["表示名", "自己紹介", "GitHub", "X"]) {
        const input = canvas.getByRole("textbox", { name });
        const originalValue = (input as HTMLInputElement).value;
        await userEvent.type(input, "a");
        await expect(isUnloadPrevented()).toBe(true);
        await userEvent.click(
          canvas.getByRole("link", { name: "別のページへ" }),
        );
        await expect(input).toBeVisible();
        await expect(confirm).toHaveBeenCalledWith(
          expect.stringContaining("保存していない変更"),
        );
        await userEvent.clear(input);
        if (originalValue) await userEvent.type(input, originalValue);
        await expect(isUnloadPrevented()).toBe(false);
      }
      await userEvent.type(
        canvas.getByRole("textbox", { name: "表示名" }),
        "変更",
      );
      const count = confirm.mock.calls.length;
      await userEvent.click(
        canvas.getByRole("button", { name: "前のページへ" }),
      );
      await waitFor(() => expect(confirm).toHaveBeenCalledTimes(count + 1));
      await expect(
        canvas.getByRole("textbox", { name: "表示名" }),
      ).toBeVisible();
      confirm.mockReturnValue(true);
      await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
      await expect(
        await canvas.findByRole("heading", { name: "移動先のページ" }),
      ).toBeVisible();
      await expect(isUnloadPrevented()).toBe(false);
    } finally {
      window.confirm = originalConfirm;
    }
  },
};

export const UnchangedProfileCanLeave: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalConfirm = window.confirm;
    const confirm = fn(() => false);
    window.confirm = confirm;
    try {
      await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
      await expect(
        await canvas.findByRole("heading", { name: "移動先のページ" }),
      ).toBeVisible();
      await expect(confirm).not.toHaveBeenCalled();
    } finally {
      window.confirm = originalConfirm;
    }
  },
};

export const PreventLeavingWithAvatarChanges: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const originalConfirm = window.confirm;
    const confirm = fn(() => false);
    window.confirm = confirm;
    try {
      const input = canvas.getByLabelText(
        "アイコン画像をアップロードのファイル選択",
      );
      const source = await createImageFixture(160, 120);
      await userEvent.upload(input, source);
      let dialog = within(await body.findByRole("dialog"));
      await waitFor(() => expect(isUnloadPrevented()).toBe(true));
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await waitFor(() => expect(isUnloadPrevented()).toBe(false));
      await userEvent.upload(input, source);
      dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
      );
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await expect(isUnloadPrevented()).toBe(true);
      await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
      await expect(
        canvas.getByRole("textbox", { name: "表示名" }),
      ).toBeVisible();
      await expect(confirm).toHaveBeenCalledTimes(1);
      await userEvent.click(canvas.getByRole("button", { name: "キャンセル" }));
      await expect(confirm).toHaveBeenCalledTimes(2);
    } finally {
      window.confirm = originalConfirm;
    }
  },
};
