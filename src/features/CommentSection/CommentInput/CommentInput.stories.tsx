import { expect, fn, userEvent, within } from "storybook/test";

import CommentInput from "./index";

import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/CommentSection/CommentInput",
  component: CommentInput,
  decorators: [
    (Story) => {
      useUserStore.setState({
        user: {
          id: "viewer",
          display_name: "閲覧者",
          icon_url: "/comingSoonLugia.webp",
        },
      });
      return (
        <div style={{ width: 640 }}>
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  args: { onSubmit: fn(async () => true) },
} satisfies Meta<typeof CommentInput>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "コメントを入力" });
    await userEvent.type(input, "コメント本文{Control>}{Enter}{/Control}");
    await expect(args.onSubmit).toHaveBeenCalledWith("コメント本文");
    await expect(input).toHaveValue("");
    await expect(canvas.getByText("0/255")).toBeVisible();
  },
};

export const Submitting: Story = { args: { isSubmitting: true } };

export const CharacterLimit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "コメントを入力" });
    await userEvent.click(input);
    await userEvent.paste("😀".repeat(256));
    await expect(input).toHaveValue("😀".repeat(255));
    await expect(canvas.getByText("255/255")).toBeVisible();
  },
};
