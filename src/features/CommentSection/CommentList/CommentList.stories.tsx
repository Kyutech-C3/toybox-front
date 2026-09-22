import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, within } from "storybook/test";

import CommentList from "./index";

import { useUserStore } from "@/features/auth/store/useUserStore";

import type { Meta, StoryObj } from "@storybook/react";
import type { Comment } from "@/shared/types/comment";

const COMMENTS: Comment[] = [
  {
    id: "comment-1",
    content: "とても分かりやすい作品でした。",
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
    reply_at: "",
    user: {
      id: "user-1",
      display_name: "Toybox User",
      avatar_url: "/comingSoonLugia.webp",
    },
  },
  {
    id: "comment-2",
    content: "ありがとうございます！",
    created_at: "2026-09-20T11:00:00Z",
    updated_at: "2026-09-20T11:00:00Z",
    reply_at: "comment-1",
    user: {
      id: "user-2",
      display_name: "作者",
      avatar_url: "/comingSoonHo-Oh.webp",
    },
  },
];

const META = {
  title: "Features/CommentSection/CommentList",
  component: CommentList,
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
        <MemoryRouter>
          <div style={{ width: "min(720px, 90vw)" }}>
            <Story />
          </div>
        </MemoryRouter>
      );
    },
  ],
  tags: ["autodocs"],
  args: { comments: COMMENTS, onReply: fn(), onSubmitReply: async () => true },
} satisfies Meta<typeof CommentList>;

export default META;
type Story = StoryObj<typeof META>;

export const Thread: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: "返信" })[0]);
    await expect(args.onReply).toHaveBeenCalledWith(COMMENTS[0]);
  },
};

export const Replying: Story = { args: { replyingTo: COMMENTS[0] } };
export const ReadOnly: Story = { args: { isReplyEnabled: false } };
export const Empty: Story = { args: { comments: [] } };
