import { expect, userEvent, within } from "storybook/test";
import { SWRConfig } from "swr";

import { SearchBar } from "./index";
import { useTagsStore } from "./store/useTagsStore";

import type { Meta, StoryObj } from "@storybook/react";

const TAGS = [
  {
    id: "tag-react",
    name: "React",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "tag-typescript",
    name: "TypeScript",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const META = {
  title: "Features/WorkIndex/SearchBar",
  component: SearchBar,
  decorators: [
    (Story) => (
      <SWRConfig value={{ fallback: { "/tags": { tags: TAGS } } }}>
        <div style={{ width: 640 }}>
          <Story />
        </div>
      </SWRConfig>
    ),
  ],
  tags: ["autodocs"],
  beforeEach: () => useTagsStore.setState({ tags: [] }),
} satisfies Meta<typeof SearchBar>;

export default META;
type Story = StoryObj<typeof META>;

export const FilterByTag: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "タグで絞り込み" });
    await userEvent.type(input, "type");
    await userEvent.click(canvas.getByRole("option", { name: "TypeScript" }));
    await expect(canvas.getByText("TypeScript")).toBeVisible();
  },
};
