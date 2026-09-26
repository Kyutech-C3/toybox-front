import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import Input from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const InputWithState = (props: React.ComponentProps<typeof Input>) => {
  const [value, setValue] = useState(props.value);
  return <Input {...props} value={value} onChange={setValue} />;
};

const META = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    value: "",
    onChange: () => undefined,
    heading: "タイトル",
    placeholder: "タイトルを入力",
  },
  render: (args) => <InputWithState {...args} />,
} satisfies Meta<typeof Input>;

export default META;
type Story = StoryObj<typeof META>;

export const Empty: Story = {};

export const Filled: Story = { args: { value: "電子工作の作品" } };

export const Disabled: Story = {
  args: { value: "変更できない値", disabled: true },
};

export const Editable: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", {
      name: "タイトル",
    });
    await userEvent.type(input, "Toybox");
    await expect(input).toHaveValue("Toybox");
  },
};
