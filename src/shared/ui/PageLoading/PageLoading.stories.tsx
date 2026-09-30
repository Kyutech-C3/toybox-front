import PageLoading from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/PageLoading",
  component: PageLoading,
  tags: ["autodocs"],
} satisfies Meta<typeof PageLoading>;

export default META;
type Story = StoryObj<typeof META>;

export const Page: Story = {};
export const Section: Story = { args: { layout: "section" } };
