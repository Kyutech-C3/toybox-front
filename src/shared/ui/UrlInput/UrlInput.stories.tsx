import UrlInput from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const NOOP = () => undefined;

const META: Meta<typeof UrlInput> = {
  title: "UI/UrlInput",
  component: UrlInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    heading: "URL",
    isOptional: true,
    value: "",
    urls: [],
    maxUrlCount: 5,
    placeholder: "https://example.com",
    onChange: NOOP,
    onAddUrl: NOOP,
    onRemoveUrl: NOOP,
  },
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

export const WithUrls: Story = {
  args: {
    value: "https://toy",
    urls: [
      "https://toybox.compositecomputer.club/",
      "https://github.com/Kyutech-C3",
    ],
  },
};

export const WithError: Story = {
  args: {
    value: "example.com",
    errorMessage: "http:// または https:// から始まるURLを入力してください",
  },
};

export const MaxUrls: Story = {
  args: {
    urls: [
      "https://example.com/1",
      "https://example.com/2",
      "https://example.com/3",
      "https://example.com/4",
      "https://example.com/5",
    ],
    errorMessage: "URLは最大5個まで登録できます",
  },
};
