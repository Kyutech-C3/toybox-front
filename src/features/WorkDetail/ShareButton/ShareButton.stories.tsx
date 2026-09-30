import { expect, within } from "storybook/test";

import ShareButton from "./index";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/WorkDetail/ShareButton",
  component: ShareButton,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { title: "作品タイトル" },
} satisfies Meta<typeof ShareButton>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "この作品を共有する" }),
    ).toBeVisible();
  },
};
