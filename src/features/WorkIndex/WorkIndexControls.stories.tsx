import { useState } from "react";

import SortOrderSwitch from "./SortOrderSwitch";
import VisibilityFilter from "./VisibilityFilter";

import type { Meta, StoryObj } from "@storybook/react";

const Controls = () => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [visibility, setVisibility] = useState<"public" | "private" | null>(
    null,
  );
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SortOrderSwitch value={sortOrder} onChange={setSortOrder} />
      <VisibilityFilter value={visibility} onChange={setVisibility} />
    </div>
  );
};

const META = {
  title: "Features/WorkIndex/Controls",
  component: Controls,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Controls>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};
