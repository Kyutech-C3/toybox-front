import { MemoryRouter } from "react-router-dom";

import Card from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { Tag, Work } from "@/shared/types/work";

const toTag = (id: string, name: string): Tag => ({
  id,
  name,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
});

const MOCK_WORK: Work = {
  assets: [],
  tags: [toTag("tag-1", "Unity"), toTag("tag-2", "ゲーム")],
  id: "work-1",
  title: "作品タイトル",
  description: "",
  description_html: "",
  user: {
    id: "user-1",
    display_name: "UserName",
    avatar_url: "/comingSoonLugia.webp",
  },
  thumbnail_url: "/comingSoonLugia.webp",
  visibility: "public",
  thumbnail_asset_id: "",
  urls: [],
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const getContainerWidth = (parameters: { containerWidth?: string }) =>
  parameters.containerWidth ?? "min(320px, 100%)";

const META: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  decorators: [
    (Story, context) => (
      <MemoryRouter>
        <div style={{ width: getContainerWidth(context.parameters) }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  args: {
    work: MOCK_WORK,
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

export const Editable: Story = {
  args: {
    viewerUserID: MOCK_WORK.user.id,
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile2", isRotated: false },
  },
  parameters: {
    containerWidth: "min(640px, 90vw)",
  },
  args: {
    viewerUserID: MOCK_WORK.user.id,
  },
};

export const OverflowingTitleAndTags: Story = {
  args: {
    work: {
      ...MOCK_WORK,
      title: "とても長いタイトルの作品でカード幅に収まりきらないもの",
      tags: [
        toTag("tag-1", "Unity"),
        toTag("tag-2", "ゲーム"),
        toTag("tag-3", "3DCG"),
        toTag("tag-4", "個人制作"),
        toTag("tag-5", "サウンド"),
      ],
    },
  },
};
