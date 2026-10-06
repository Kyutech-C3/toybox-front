import { useState } from "react";

import CharacterCount from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/CharacterCount",
  component: CharacterCount,
  tags: ["autodocs"],
  args: { value: "Toybox", maxLength: 100 },
} satisfies Meta<typeof CharacterCount>;

export default META;
type Story = StoryObj<typeof META>;

export const Limited: Story = {};
export const Unlimited: Story = { args: { maxLength: undefined } };
export const OverLimit: Story = { args: { maxLength: 5 } };

const EditableCount = () => {
  const [value, setValue] = useState("");
  return (
    <div>
      <input
        aria-label="本文"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <CharacterCount value={value} maxLength={2} />
    </div>
  );
};

export const Editing: Story = {
  render: () => <EditableCount />,
};
