import { useState } from "react";

import TagInput from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { TagDetail } from "@/shared/types/work";

const INITIAL_TAGS: TagDetail[] = [
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
  {
    id: "new-tag",
    name: "新しいタグ",
    work_count: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const TagInputPreview = () => {
  const [options, setOptions] = useState(INITIAL_TAGS);
  const [selectedIDs, setSelectedIDs] = useState<string[]>(["react"]);

  return (
    <div style={{ width: "min(480px, 100%)" }}>
      <TagInput
        heading="タグ"
        tags={options.filter((tag) => selectedIDs.includes(tag.id))}
        allTagOptions={options}
        onAddTag={(tagID) => setSelectedIDs((current) => [...current, tagID])}
        onCreateTag={(name) => {
          const existing = options.find((tag) => tag.name === name);
          if (existing) {
            setSelectedIDs((current) => [
              ...new Set([...current, existing.id]),
            ]);
            return;
          }
          setOptions((current) => [
            ...current,
            {
              id: name,
              name,
              work_count: 0,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            },
          ]);
          setSelectedIDs((current) => [...current, name]);
        }}
        onRemoveTag={(tagID) =>
          setSelectedIDs((current) => current.filter((id) => id !== tagID))
        }
      />
    </div>
  );
};

const META: Meta<typeof TagInput> = {
  title: "UI/TagInput",
  component: TagInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  render: () => <TagInputPreview />,
};
