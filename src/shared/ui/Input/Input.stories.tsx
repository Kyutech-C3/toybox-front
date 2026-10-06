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

export const CharacterLimit: Story = {
  tags: ["test"],
  args: { maxLength: 5, isCharacterCountVisible: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "タイトル" });
    await userEvent.click(input);
    await userEvent.paste("あ😀いうえお");
    await expect(input).toHaveValue("あ😀いうえ");
    await userEvent.clear(input);
    await fireEvent.compositionStart(input);
    await fireEvent.change(input, { target: { value: "あいうえおか" } });
    await expect(input).toHaveValue("あいうえおか");
    await fireEvent.compositionEnd(input, { data: "あいうえおか" });
    await expect(input).toHaveValue("あいうえお");
    await expect(canvas.getByText("5/5")).toBeVisible();
  },
};

export const LinkWithCounter: Story = {
  args: {
    heading: "リンク",
    value: "https://example.com/",
    type: "url",
    isCharacterCountVisible: true,
    leadingContent: <span aria-hidden="true">↗</span>,
    trailingContent: (
      <button type="button" aria-label="リンクを削除">
        ×
      </button>
    ),
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <InputWithState {...args} />
    </div>
  ),
};
