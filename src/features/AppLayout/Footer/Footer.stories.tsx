import Footer from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/AppLayout/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Footer>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};
