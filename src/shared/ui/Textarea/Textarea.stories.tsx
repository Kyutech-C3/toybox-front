import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import Textarea from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

const EditableTextarea = (props: ComponentProps<typeof Textarea>) => {
  const [value, setValue] = useState(props.value);
  return <Textarea {...props} value={value} onChange={setValue} />;
};

const META = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    value: "",
    onChange: () => undefined,
    "aria-label": "本文",
    isCharacterCountVisible: true,
  },
  render: (args) => <EditableTextarea {...args} />,
} satisfies Meta<typeof Textarea>;

export default META;
type Story = StoryObj<typeof META>;

export const Unlimited: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "本文" }),
      "あ😀い",
    );
    await expect(canvas.getByText("3")).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { value: "編集できません", disabled: true },
};

export const CharacterLimit: Story = {
  args: { maxLength: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "本文" });
    await userEvent.click(input);
    await userEvent.paste("あ😀いうえお");
    await expect(input).toHaveValue("あ😀いうえ");
    const counter = canvas.getByText("5/5");
    await expect(counter.getBoundingClientRect().bottom).toBeLessThan(
      input.getBoundingClientRect().bottom,
    );
    await userEvent.clear(input);
    await fireEvent.compositionStart(input);
    await fireEvent.change(input, { target: { value: "あいうえおか" } });
    await expect(input).toHaveValue("あいうえおか");
    await fireEvent.compositionEnd(input, { data: "あいうえおか" });
    await expect(input).toHaveValue("あいうえお");
    await expect(canvas.getByText("5/5")).toBeVisible();
  },
};
