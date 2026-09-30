import { expect, within } from "storybook/test";

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

export const WithUrls: Story = {
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    for (const link of links) {
      const icon = link.querySelector<HTMLSpanElement>(
        'span[aria-hidden="true"]',
      );
      const label = link.querySelector<HTMLSpanElement>(
        'span:not([aria-hidden="true"])',
      );
      if (!icon || !label)
        throw new Error("リンクのアイコンか URL がありません");
      const iconBounds = icon.getBoundingClientRect();
      const labelBounds = label.getBoundingClientRect();
      const centerOffset = Math.abs(
        iconBounds.top +
          iconBounds.height / 2 -
          (labelBounds.top + labelBounds.height / 2),
      );
      await expect(centerOffset).toBeLessThanOrEqual(1);
    }
  },
};
