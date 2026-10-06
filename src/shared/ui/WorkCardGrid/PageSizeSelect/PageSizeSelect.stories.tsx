import { useWorkPageSizeStore } from "../store/useWorkPageSizeStore";
import PageSizeSelect from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/WorkCardGrid/PageSizeSelect",
  component: PageSizeSelect,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  beforeEach: () => useWorkPageSizeStore.setState({ pageSize: 30 }),
} satisfies Meta<typeof PageSizeSelect>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};
