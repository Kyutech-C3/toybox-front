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

const SAVE_KEY: UserPortfolioSWRKey = [
  "/profile-save",
  "/profile-save-works",
  "storybook-profile-token",
];
const SAVE = {
  onClose: fn(),
  save: fn<() => Promise<Response>>(),
  revalidate: fn<() => Promise<null>>(),
  completeSave: (_response: Response) => {},
  completeRevalidation: () => {},
};

const SaveRevalidation = () => {
  useSWR(SAVE_KEY, SAVE.revalidate, {
    suspense: false,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return null;
};

const SAVE_STORY: Story = {
  args: { userPortfolioSWRKey: SAVE_KEY, onClose: SAVE.onClose },
  render: (args) => (
    <>
      <SaveRevalidation />
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
    SAVE.onClose.mockClear();
    SAVE.save.mockReset().mockReturnValue(
      new Promise<Response>((resolve) => {
        SAVE.completeSave = resolve;
      }),
    );
    SAVE.revalidate.mockReset().mockReturnValue(
      new Promise<null>((resolve) => {
        SAVE.completeRevalidation = () => resolve(null);
      }),
    );
    window.fetch = (input, init) =>
      String(input).endsWith("/auth/users") && init?.method === "PATCH"
        ? SAVE.save()
        : originalFetch(input, init);
    return async () => {
      SAVE.completeSave(Response.json(PROFILE));
      SAVE.completeRevalidation();
      window.fetch = originalFetch;
      await mutate(SAVE_KEY, undefined, { revalidate: false });
      useAuthStore.setState(originalAuth);
      useUserStore.setState(originalUser);
    };
  },
};

const submitProfile = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByRole("textbox", { name: "表示名" }), "変更");
  await userEvent.click(canvas.getByRole("button", { name: "保存" }));
  return canvas;
};

const finishIgnoredSave = async (
  canvasElement: HTMLElement,
  response = Response.json(PROFILE),
) => {
  SAVE.completeSave(response);
  SAVE.completeRevalidation();
  // 解放したPromiseから保存の完了処理までを次のtaskで待つ。
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  await expect(SAVE.onClose).not.toHaveBeenCalled();
  const body = within(canvasElement.ownerDocument.body);
  await expect(body.queryByText(/^プロフィールを更新/)).not.toBeInTheDocument();
};

export const SaveProfile: Story = {
  ...SAVE_STORY,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    SAVE.save.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const canvas = await submitProfile(canvasElement);
    await waitFor(() =>
      expect(
        body.getByText("プロフィールを更新できませんでした"),
      ).toBeVisible(),
    );
    await expect(SAVE.onClose).not.toHaveBeenCalled();
    await expect(SAVE.revalidate).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));
    await expect(
      canvas.getByRole("button", { name: "保存中..." }),
    ).toBeDisabled();
    useAuthStore.getState().setAccessToken("storybook-refreshed-token");
    useUserStore.getState().setUser({
      id: PROFILE.id,
      display_name: PROFILE.display_name,
      icon_url: "/favicon.svg",
    });
    SAVE.completeSave(Response.json(PROFILE));
    await waitFor(() => expect(SAVE.revalidate).toHaveBeenCalledTimes(1));
    SAVE.completeRevalidation();
    await waitFor(() => expect(SAVE.onClose).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(body.getByText("プロフィールを更新しました")).toBeVisible(),
    );
    await expect(useUserStore.getState().user).toEqual({
      id: PROFILE.id,
      display_name: `${PROFILE.display_name}変更`,
      icon_url: "/favicon.svg",
    });
    await expect(useAuthStore.getState().accessToken).toBe(
      "storybook-refreshed-token",
    );
  },
};

export const SaveAfterLogout: Story = {
  ...SAVE_STORY,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    await submitProfile(canvasElement);
    await clearAuthSession();
    await finishIgnoredSave(canvasElement);
    await expect(SAVE.revalidate).not.toHaveBeenCalled();
    await expect(useUserStore.getState().user).toBeNull();
  },
};

export const RevalidationAfterNewSession: Story = {
  ...SAVE_STORY,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    await submitProfile(canvasElement);
    SAVE.completeSave(Response.json(PROFILE));
    await waitFor(() => expect(SAVE.revalidate).toHaveBeenCalledTimes(1));
    await clearAuthSession();
    // 同じトークン・ユーザーでも、新しいログインの結果は上書きしない。
    useAuthStore.getState().startSession("storybook-profile-token");
    useUserStore.getState().setUser({
      id: PROFILE.id,
      display_name: "再ログイン後の名前",
      icon_url: "",
    });
    await finishIgnoredSave(canvasElement);
    await expect(useUserStore.getState().user?.display_name).toBe(
      "再ログイン後の名前",
    );
  },
};

const leaveDuringSave = async (canvasElement: HTMLElement) => {
  const canvas = await submitProfile(canvasElement);
  const originalConfirm = window.confirm;
  window.confirm = () => true;
  try {
    await userEvent.click(canvas.getByRole("link", { name: "別のページへ" }));
    await expect(
      await canvas.findByRole("heading", { name: "移動先のページ" }),
    ).toBeVisible();
  } finally {
    window.confirm = originalConfirm;
  }
};

export const SaveAfterUnmount: Story = {
  ...SAVE_STORY,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    await leaveDuringSave(canvasElement);
    await finishIgnoredSave(canvasElement);
    await expect(SAVE.revalidate).not.toHaveBeenCalled();
    await expect(useUserStore.getState().user?.display_name).toBe(
      PROFILE.display_name,
    );
  },
};

export const SaveFailureAfterUnmount: Story = {
  ...SAVE_STORY,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    await leaveDuringSave(canvasElement);
    await finishIgnoredSave(canvasElement, new Response(null, { status: 500 }));
  },
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
