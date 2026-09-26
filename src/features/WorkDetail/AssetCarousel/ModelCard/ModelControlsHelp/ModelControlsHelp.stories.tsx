import { expect, userEvent, waitFor, within } from "storybook/test";

import ModelControlsHelp from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/WorkDetail/ModelControlsHelp",
  component: ModelControlsHelp,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: "min(520px, 90vw)",
          height: 420,
          background: "var(--asset-background)",
        }}
      >
        <Story />
        <button type="button" style={{ position: "relative", zIndex: 3 }}>
          外側の操作
        </button>
      </div>
    ),
  ],
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
    await waitFor(() =>
      expect(
        canvas.getByRole("dialog", { name: "3Dモデルの操作方法" }),
      ).toBeVisible(),
    );
    await expect(canvas.getByRole("dialog")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole("button", { name: "外側の操作" }));
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(button);
    await userEvent.tab();
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
