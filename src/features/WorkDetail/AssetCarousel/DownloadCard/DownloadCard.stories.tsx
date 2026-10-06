import DownloadCard from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof DownloadCard> = {
  title: "Features/WorkDetail/DownloadCard",
  component: DownloadCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Zip: Story = {
  args: {
    assetType: "zip",
    extension: "zip",
    url: "https://example.com/assets/source.zip",
  },
};

export const UnsupportedType: Story = {
  args: {
    assetType: "future-format",
    extension: "blend",
    url: "https://example.com/assets/model.blend",
  },
};

export const LoadError: Story = {
  args: {
    assetType: "image",
    extension: "webp",
    isLoadError: true,
    url: "https://example.com/assets/image.webp",
  },
};

export const UnsafeURL: Story = {
  args: {
    assetType: "zip",
    extension: "zip",
    url: "javascript:alert('unsafe')",
  },
};
