import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

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

export const CharacterLimit: Story = {
  args: { maxLength: 5, isCharacterCountVisible: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "タイトル" });
    await userEvent.click(input);
    await userEvent.paste("あ😀いうえお");
    await expect(input).toHaveValue("あ😀いうえ");
    const counter = canvas.getByText("5/5");
    const inputRect = input.getBoundingClientRect();
    const counterRect = counter.getBoundingClientRect();
    await expect(counterRect.right).toBeLessThan(inputRect.right);
    await expect(counterRect.bottom).toBeLessThan(inputRect.bottom);
    await expect(counterRect.top).toBeGreaterThan(inputRect.top);
    await userEvent.clear(input);
    await fireEvent.compositionStart(input);
    await fireEvent.change(input, { target: { value: "あいうえおか" } });
    await expect(input).toHaveValue("あいうえおか");
    await fireEvent.compositionEnd(input, { data: "あいうえおか" });
    await expect(input).toHaveValue("あいうえお");
    await expect(canvas.getByText("5/5")).toBeVisible();
  },
};
