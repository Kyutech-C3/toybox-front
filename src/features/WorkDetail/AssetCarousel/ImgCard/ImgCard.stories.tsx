import { expect, within } from "storybook/test";

import ImgCard from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof ImgCard> = {
  title: "Features/WorkDetail/ImgCard",
  component: ImgCard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  args: {
    alt: "作品のアセット画像",
    src: "/comingSoonHo-Oh.webp",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: "画像を全画面表示" }),
    ).toBeInTheDocument();
  },
};
