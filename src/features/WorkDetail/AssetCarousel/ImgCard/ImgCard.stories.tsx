import { expect, within } from "storybook/test";

import ImgCard from "./index";

import SAMPLE_IMAGE_URL from "@/stories/assets/sampleImage.svg?no-inline";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof ImgCard> = {
  title: "Features/WorkDetail/ImgCard",
  component: ImgCard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ height: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    alt: "作品のアセット画像",
    src: SAMPLE_IMAGE_URL,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("img", { name: "作品のアセット画像" }),
    ).toBeInTheDocument();
  },
};
