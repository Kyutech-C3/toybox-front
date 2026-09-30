import WorkMetaBar from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/WorkMetaBar",
  component: WorkMetaBar,
  args: {
    visibility: "public",
    createdAt: "2026-09-01T19:15:00+09:00",
    updatedAt: "2026-09-02T08:30:00+09:00",
  },
} satisfies Meta<typeof WorkMetaBar>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile2", isRotated: false },
  },
};
