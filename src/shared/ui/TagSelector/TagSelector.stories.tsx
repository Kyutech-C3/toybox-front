import { useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

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

const TOP_PAGE_TAGS: TagDetail[] = Array.from({ length: 28 }, (_, index) => ({
  ...TAGS[0],
  id: `tag-${index + 1}`,
  name: index % 5 === 0 ? `少し長いタグ${index + 1}` : `タグ${index + 1}`,
  work_count: 28 - index,
}));

const TopPagePreview = () => {
  const [selectedIDs, setSelectedIDs] = useState<string[]>(["tag-1"]);

  return (
    <div style={{ width: "min(980px, 100%)" }}>
      <TagSelector
        allTags={TOP_PAGE_TAGS}
        selectedTags={TOP_PAGE_TAGS.filter((tag) =>
          selectedIDs.includes(tag.id),
        )}
        onAddTag={(tagID) => setSelectedIDs((current) => [...current, tagID])}
        onRemoveTag={(tagID) =>
          setSelectedIDs((current) => current.filter((id) => id !== tagID))
        }
        onClearTags={() => setSelectedIDs([])}
      />
    </div>
  );
};

export const TopPage: Story = {
  render: () => <TopPagePreview />,
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "タグで作品を探す" });
    await userEvent.click(search);
    fireEvent.compositionStart(search);
    fireEvent.input(search, { target: { value: "タグ" }, isComposing: true });
    const dialog = canvas.getByRole("dialog", { name: "タグの選択" });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByRole("searchbox")).toBe(search);
    await expect(search).toHaveFocus();
    fireEvent.compositionEnd(search, { data: "タグ" });
    await userEvent.type(search, "2");
    await expect(search).toHaveValue("タグ2");
    await expect(document.documentElement).toHaveAttribute(
      "data-scroll-locked",
      "true",
    );
    await userEvent.keyboard("{Tab}");
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    await expect(search).toHaveFocus();
    await expect(search).toHaveValue("タグ2");
    await expect(document.documentElement).not.toHaveAttribute(
      "data-scroll-locked",
    );
    const sort =
      canvas.queryByRole("radio", { name: "名前順" }) ??
      canvas.getByRole("button", { name: /タグの並び順/ });
    sort.focus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(sort).toHaveFocus();
  },
};
