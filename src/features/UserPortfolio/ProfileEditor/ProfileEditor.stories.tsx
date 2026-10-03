import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import ProfileEditor from "./index";

import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";

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
              <ToastProvider>
                <div style={{ width: "min(640px, 100%)" }}>
                  <Story />
                  <ProfileNavigation />
                </div>
              </ToastProvider>
            ),
          },
          { path: "/other", element: <h1>移動先のページ</h1> },
        ],
        { initialEntries: ["/other", "/profile"], initialIndex: 1 },
      );
      return <RouterProvider router={router} />;
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

export const ValidationError: Story = {
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

export const NormalizedUsernameLimits: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const { name, username, maxLength } of [
      { name: "GitHub", username: "a".repeat(39), maxLength: 39 },
      { name: "X", username: "abcdefghijklmno", maxLength: 15 },
    ]) {
      const input = canvas.getByRole("textbox", { name });
      await userEvent.clear(input);
      await userEvent.click(input);
      await userEvent.paste(`  ＠${username}  `);
      await expect(input).toHaveValue(`  ＠${username}  `);
      await expect(canvas.getByText(`${maxLength}/${maxLength}`)).toBeVisible();
      await expect(input).toHaveAttribute("aria-invalid", "false");
      await userEvent.tab();
      await expect(input).toHaveValue(username);

      await userEvent.click(input);
      await userEvent.type(input, "a");
      await expect(input).toHaveValue(`${username}a`);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(canvas.getByRole("button", { name: "保存" })).toBeDisabled();
      await userEvent.keyboard("{Backspace}");
      await expect(input).toHaveAttribute("aria-invalid", "false");
    }
  },
};

const isUnloadPrevented = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

export const PreventLeavingWithChanges: Story = {
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
