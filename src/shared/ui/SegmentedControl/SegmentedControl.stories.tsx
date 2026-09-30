import { useState } from "react";

import SegmentedControl from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof SegmentedControl> = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

const DeselectableTwoOptions = () => {
  const [value, setValue] = useState<"public" | "private" | null>(null);

  return (
    <SegmentedControl
      options={[
        { value: "public", label: "全体公開" },
        { value: "private", label: "限定公開" },
      ]}
      value={value}
      onChange={setValue}
      onDeselect={() => setValue(null)}
      ariaLabel="公開範囲"
    />
  );
};

const DeselectableThreeOptions = () => {
  const [value, setValue] = useState<"public" | "private" | "draft" | null>(
    null,
  );

  return (
    <SegmentedControl
      options={[
        { value: "public", label: "全体公開" },
        { value: "private", label: "限定公開" },
        { value: "draft", label: "下書き" },
      ]}
      value={value}
      onChange={setValue}
      onDeselect={() => setValue(null)}
      ariaLabel="公開範囲"
    />
  );
};

export const TwoOptions: Story = {
  render: () => <DeselectableTwoOptions />,
};

export const ThreeOptions: Story = {
  render: () => <DeselectableThreeOptions />,
};
