import Batch from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Batch> = {
  title: "UI/Batch",
  component: Batch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: { control: "text" },
  },
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    children: "React",
  },
};

export const TypeScript: Story = {
  args: {
    children: "TypeScript",
  },
};

export const LongTag: Story = {
  args: {
    children: "JavaScript Development",
  },
};
