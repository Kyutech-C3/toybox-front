import Paper from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/Paper",
  component: Paper,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: <div style={{ padding: 24 }}>Paper の内容</div> },
} satisfies Meta<typeof Paper>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};
export const LongContent: Story = {
  args: {
    children: (
      <div style={{ width: 480, padding: 24 }}>
        長い内容でも余白と背景を維持します。文章が複数行になる状態を確認するための
        Story です。
      </div>
    ),
  },
};
