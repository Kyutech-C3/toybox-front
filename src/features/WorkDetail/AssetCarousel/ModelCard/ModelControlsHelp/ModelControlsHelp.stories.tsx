import { expect, userEvent, within } from "storybook/test";

import ModelControlsHelp from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/WorkDetail/ModelControlsHelp",
  component: ModelControlsHelp,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ModelControlsHelp>;

export default META;
type Story = StoryObj<typeof META>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: "3Dモデルの操作方法を表示",
    });
    await userEvent.click(button);
    await expect(
      canvas.getByRole("dialog", { name: "3Dモデルの操作方法" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
  },
};
