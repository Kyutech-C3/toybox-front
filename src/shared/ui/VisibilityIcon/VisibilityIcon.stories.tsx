import VisibilityIcon from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof VisibilityIcon> = {
  title: "UI/VisibilityIcon",
  component: VisibilityIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <VisibilityIcon visibility="public" />
      <VisibilityIcon visibility="private" />
      <VisibilityIcon visibility="draft" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <VisibilityIcon visibility="public" isLabelVisible />
      <VisibilityIcon visibility="private" isLabelVisible />
      <VisibilityIcon visibility="draft" isLabelVisible />
    </div>
  ),
};
