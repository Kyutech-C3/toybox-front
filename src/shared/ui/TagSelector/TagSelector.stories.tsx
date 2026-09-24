import { useState } from "react";

import TagSelector from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { TagDetail } from "@/shared/types/work";

const TAGS: TagDetail[] = [
  {
    id: "react",
    name: "react",
    work_count: 12,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "typescript",
    name: "typescript",
    work_count: 8,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const SelectorPreview = () => {
  const [selectedIDs, setSelectedIDs] = useState<string[]>(["react"]);

  return (
    <div style={{ width: "min(480px, 100%)" }}>
      <TagSelector
        allTags={TAGS}
        selectedTags={TAGS.filter((tag) => selectedIDs.includes(tag.id))}
        onAddTag={(tagID) => setSelectedIDs((current) => [...current, tagID])}
        onRemoveTag={(tagID) =>
          setSelectedIDs((current) => current.filter((id) => id !== tagID))
        }
        onClearTags={() => setSelectedIDs([])}
      />
    </div>
  );
};

const META: Meta<typeof TagSelector> = {
  title: "UI/TagSelector",
  component: TagSelector,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  render: () => <SelectorPreview />,
};
