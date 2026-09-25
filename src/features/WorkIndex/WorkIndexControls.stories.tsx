import { expect, userEvent, within } from "storybook/test";

import SortOrderSwitch from "./SortOrderSwitch";
import VisibilityFilter from "./VisibilityFilter";

import type { Meta, StoryObj } from "@storybook/react";

const Controls = () => (
  <div style={{ display: "grid", gap: 24 }}>
    <SortOrderSwitch />
    <VisibilityFilter />
  </div>
);

const META = {
  title: "Features/WorkIndex/Controls",
  component: Controls,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Controls>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("古い順"));
    await expect(canvas.getByRole("radio", { name: "古い順" })).toBeChecked();
    const visibility = canvas.getByRole("button", { name: "限定公開" });
    await userEvent.click(visibility);
    await expect(visibility).toHaveAttribute("aria-pressed", "true");
  },
};
