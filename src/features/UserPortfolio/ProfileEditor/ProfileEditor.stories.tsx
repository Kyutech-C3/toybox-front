import { expect, userEvent, within } from "storybook/test";

import ProfileEditor from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const PROFILE = {
  id: "user-1",
  display_name: "Toybox User",
  profile: "電子工作とWeb開発をしています。",
  avatar_url: "/comingSoonLugia.webp",
  github_id: "toybox-user",
  twitter_id: "toybox_user",
};

const META = {
  title: "Features/UserPortfolio/ProfileEditor",
  component: ProfileEditor,
  decorators: [
    (Story) => (
      <ToastProvider>
        <div style={{ width: 640 }}>
          <Story />
        </div>
      </ToastProvider>
    ),
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
