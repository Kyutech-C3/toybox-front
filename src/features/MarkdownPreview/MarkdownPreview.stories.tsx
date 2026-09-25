import { expect, userEvent, within } from "storybook/test";

import MarkdownPreview from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/MarkdownPreview",
  component: MarkdownPreview,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: "min(760px, 90vw)" }}>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownPreview>;

export default META;
type Story = StoryObj<typeof META>;

export const RichContent: Story = {
  args: {
    content:
      '# 作品説明\n\n**太字**、[リンク](https://example.com)、リストを表示します。\n\n- React\n- TypeScript\n\n```ts\nconst message = "Toybox";\n```',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "作品説明" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "コードをコピー" }),
    );
  },
};

export const TableAndTaskList: Story = {
  args: {
    content:
      "| 項目 | 状態 |\n| --- | --- |\n| Storybook | 完了 |\n\n- [x] UI確認\n- [ ] 実機確認",
  },
};

export const Empty: Story = { args: { content: "" } };
