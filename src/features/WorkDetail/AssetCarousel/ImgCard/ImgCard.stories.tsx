import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import ImgCard from "./index";

import { TEST_IMAGE_URL } from "@/stories/fixtures";

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
      <div
        style={{
          height: 320,
          position: "relative",
          color: "var(--asset-font-color)",
        }}
      >
        <ImageOutlinedIcon
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: 1,
            inset: 0,
            margin: "auto",
            fontSize: 48,
          }}
        />
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
    src: TEST_IMAGE_URL,
  },
};
