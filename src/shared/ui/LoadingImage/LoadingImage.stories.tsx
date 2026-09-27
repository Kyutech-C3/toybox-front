import { expect, waitFor, within } from "storybook/test";

import LoadingImage from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/LoadingImage",
  component: LoadingImage,
  args: { src: "/comingSoonLugia.webp", alt: "プレビュー" },
  decorators: [
    (Story) => (
      <div style={{ width: 160, height: 120 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoadingImage>;

export default META;
type Story = StoryObj<typeof META>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const image = canvas.getByRole("img") as HTMLImageElement;
      expect(image.complete && image.naturalWidth > 0).toBe(true);
      expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    });
  },
};

export const LoadFailure: Story = {
  args: { src: "/missing-loading-image.webp" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const image = canvas.getByRole("img") as HTMLImageElement;
      expect(image.complete && image.naturalWidth === 0).toBe(true);
      expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    });
  },
};
