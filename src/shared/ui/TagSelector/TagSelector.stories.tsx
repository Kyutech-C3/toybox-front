import { useState } from "react";

import TagSelector from "./index";

import SegmentedControl from "@/shared/ui/SegmentedControl";

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

const TOP_PAGE_TAGS: TagDetail[] = Array.from({ length: 28 }, (_, index) => ({
  ...TAGS[0],
  id: `tag-${index + 1}`,
  name: index % 5 === 0 ? `少し長いタグ${index + 1}` : `タグ${index + 1}`,
  work_count: 28 - index,
}));

const TopPagePreview = () => {
  const [selectedIDs, setSelectedIDs] = useState<string[]>(["tag-1"]);
  const [visibility, setVisibility] = useState("public");
  const [sortOrder, setSortOrder] = useState("newest");
  const [pageSize, setPageSize] = useState("30");

  return (
    <div style={{ width: "min(980px, 100%)", display: "grid", gap: 8 }}>
      <TagSelector
        layout="top-page"
        allTags={TOP_PAGE_TAGS}
        selectedTags={TOP_PAGE_TAGS.filter((tag) =>
          selectedIDs.includes(tag.id),
        )}
        onAddTag={(tagID) => setSelectedIDs((current) => [...current, tagID])}
        onRemoveTag={(tagID) =>
          setSelectedIDs((current) => current.filter((id) => id !== tagID))
        }
        onClearTags={() => setSelectedIDs([])}
        leadingControls={
          <>
            <SegmentedControl
              options={[
                { value: "public", label: "公開" },
                { value: "private", label: "限定" },
              ]}
              value={visibility}
              onChange={setVisibility}
              ariaLabel="公開範囲"
            />
            <SegmentedControl
              options={[
                { value: "newest", label: "新しい順" },
                { value: "oldest", label: "古い順" },
              ]}
              value={sortOrder}
              onChange={setSortOrder}
              ariaLabel="並び順"
            />
          </>
        }
        trailingControls={
          <SegmentedControl
            options={[
              { value: "30", label: "30件" },
              { value: "45", label: "45件" },
            ]}
            value={pageSize}
            onChange={setPageSize}
            ariaLabel="表示件数"
          />
        }
      />
      <strong>全28件</strong>
    </div>
  );
};

export const TopPage: Story = {
  render: () => <TopPagePreview />,
};
