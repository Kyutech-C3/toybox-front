import { MemoryRouter } from "react-router-dom";

import LikeButton from "../LikeButton";
import WorkCardGrid from "./index";

import { createWork } from "@/test/fixtures";

import type { Meta, StoryObj } from "@storybook/react";

const WORKS = Array.from({ length: 6 }, (_, index) =>
  createWork({
    id: `work-${index + 1}`,
    title: `作品 ${index + 1}`,
    visibility: index === 1 ? "private" : index === 2 ? "draft" : "public",
  }),
);

const META = {
  title: "UI/WorkCardGrid",
  component: WorkCardGrid,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { works: WORKS },
} satisfies Meta<typeof WorkCardGrid>;

export default META;
type Story = StoryObj<typeof META>;

export const Grid: Story = {};
export const OwnerView: Story = { args: { viewerUserID: WORKS[0]?.user.id } };
export const WithFavorites: Story = {
  args: {
    renderFavoriteButton: (work) => (
      <LikeButton
        count={3}
        isLiked={work.id === "work-1"}
        isCountVisible
        onToggle={() => undefined}
      />
    ),
  },
};
export const Empty: Story = {
  args: { works: [], emptyMessage: "条件に一致する作品はありません。" },
};
