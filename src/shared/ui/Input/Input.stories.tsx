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

export const KeyboardFocus: Story = {
  render: (args) => (
    <div>
      <InputWithState {...args} heading="通常の入力欄" />
      <InputWithState
        {...args}
        heading="文字数付きの入力欄"
        isCharacterCountVisible
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["通常の入力欄", "文字数付きの入力欄"]) {
      await userEvent.tab();
      const input = canvas.getByRole("textbox", { name });
      await expect(input).toHaveFocus();
      const surface = input.closest('[class*="input-surface"]');
      if (!surface) throw new Error("入力欄の枠が見つかりません");
      await expect(getComputedStyle(surface).outlineStyle).toBe("solid");
      await expect(getComputedStyle(surface).outlineWidth).toBe("2px");
    }
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
    const surface = input.parentElement;
    if (!surface) throw new Error("入力欄の枠が見つかりません");
    const surfaceRect = surface.getBoundingClientRect();
    const counterRect = counter.getBoundingClientRect();
    await expect(surfaceRect.height).toBe(48);
    await expect(counterRect.right).toBeLessThan(surfaceRect.right);
    await expect(counterRect.bottom).toBeLessThan(surfaceRect.bottom);
    await expect(counterRect.top).toBeGreaterThan(surfaceRect.top);
    await expect(counterRect.left - inputRect.right).toBeCloseTo(8, 0);
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リンク" });
    const counter = canvas.getByText("20");
    const button = canvas.getByRole("button", { name: "リンクを削除" });
    const surface = input.parentElement;
    if (!surface) throw new Error("入力欄の枠が見つかりません");
    await expect(surface.getBoundingClientRect().height).toBe(48);
    await expect(
      counter.getBoundingClientRect().left -
        input.getBoundingClientRect().right,
    ).toBeCloseTo(8, 0);
    await expect(counter.getBoundingClientRect().right).toBeLessThan(
      button.getBoundingClientRect().left,
    );
  },
};
