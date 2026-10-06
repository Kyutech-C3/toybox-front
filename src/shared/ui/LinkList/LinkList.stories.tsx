import LinkList from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/LinkList",
  component: LinkList,
  args: {
    urls: [
      "https://github.com/Kyutech-C3/toybox-front",
      "https://example.com/works/a-very-long-path-that-should-stay-on-one-line",
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(600px, 90vw)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LinkList>;

export default META;
type Story = StoryObj<typeof META>;

export const WithUrls: Story = {};
