import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import LoadingImage from "./index";

import SAMPLE_IMAGE_URL from "@/stories/assets/sampleImage.svg?no-inline";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/LoadingImage",
  component: LoadingImage,
  args: { src: SAMPLE_IMAGE_URL, alt: "プレビュー" },
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

export const CachedImage: Story = {
  render: (args) => {
    const [version, setVersion] = useState(0);
    return (
      <>
        <button type="button" onClick={() => setVersion(version + 1)}>
          再表示
        </button>
        <LoadingImage key={version} {...args} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const image = canvas.getByRole("img") as HTMLImageElement;
      expect(image.complete && image.naturalWidth > 0).toBe(true);
    });
    await userEvent.click(canvas.getByRole("button", { name: "再表示" }));
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    await expect(canvas.getByRole("img")).toBeVisible();
  },
};
