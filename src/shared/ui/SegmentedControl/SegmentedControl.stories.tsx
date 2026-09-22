import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import SegmentedControl from "./index";

import type { Meta, StoryObj } from "@storybook/react";

type Value = "first" | "second" | "third";
const OPTIONS = [
  { value: "first", label: "最初" },
  { value: "second", label: "中央" },
  { value: "third", label: "最後" },
] satisfies { value: Value; label: string }[];

type StatefulControlProps = {
  role?: "radiogroup" | "tablist";
};

const StatefulControl = ({ role = "radiogroup" }: StatefulControlProps) => {
  const [value, setValue] = useState<Value>("first");
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={setValue}
      ariaLabel="表示方法"
      role={role}
    />
  );
};

const META = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    options: OPTIONS,
    value: "first",
    onChange: () => undefined,
    ariaLabel: "表示方法",
  },
} satisfies Meta<typeof SegmentedControl>;

export default META;
type Story = StoryObj<typeof META>;

export const RadioGroup: Story = {
  render: () => <StatefulControl />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("中央"));
    await expect(canvas.getByRole("radio", { name: "中央" })).toBeChecked();
  },
};

export const Tabs: Story = {
  render: () => <StatefulControl role="tablist" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("tab", { name: "最初" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: "中央" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};
