import { expect, userEvent, within } from "storybook/test";

import WorkEditorStoreProvider from "../store/WorkEditorStoreProvider";
import MarkdownEditor from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/WorkEditor/MarkdownEditor",
  component: MarkdownEditor,
  decorators: [
    (Story) => (
      <WorkEditorStoreProvider>
        <div style={{ width: "min(900px, 95vw)" }}>
          <Story />
        </div>
      </WorkEditorStoreProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownEditor>;

export default META;
type Story = StoryObj<typeof META>;

export const EditAndPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(
      "Markdown で作品の説明を書けます",
    );
    await userEvent.type(input, "# Storybook");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByRole("heading", { name: "Storybook" }),
    ).toBeVisible();
  },
};

export const EmptyPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByText("プレビューする内容がありません"),
    ).toBeVisible();
  },
};
