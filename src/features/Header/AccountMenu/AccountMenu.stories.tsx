import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, within } from "storybook/test";

import AccountMenu from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Header/AccountMenu",
  component: AccountMenu,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ minHeight: 280, paddingTop: 220 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    user: {
      id: "user-1",
      display_name: "Toybox User",
      icon_url: "/comingSoonLugia.webp",
    },
    onLogout: fn(async () => undefined),
  },
} satisfies Meta<typeof AccountMenu>;

export default META;
type Story = StoryObj<typeof META>;

export const Closed: Story = {};
export const OpenAndLogout: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "アカウントメニューを開く" }),
    );
    await expect(
      canvas.getByRole("button", { name: "アカウントメニューを開く" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByRole("menuitem", { name: "マイページ" }),
    ).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(args.onLogout).toHaveBeenCalledOnce();
  },
};

export const LongDisplayName: Story = {
  args: {
    user: {
      id: "user-2",
      display_name: "とても長い表示名を設定したユーザー",
      icon_url: "/comingSoonLugia.webp",
    },
  },
};
