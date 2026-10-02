import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

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

const MANY_TAGS: TagDetail[] = Array.from({ length: 40 }, (_, index) => ({
  ...INITIAL_TAGS[0],
  id: `tag-${index + 1}`,
  name: index % 4 === 0 ? `少し長いタグ${index + 1}` : `タグ${index + 1}`,
  work_count: 40 - index,
}));

type TagInputPreviewProps = {
  initialTags?: TagDetail[];
  initialSelectedIDs?: string[];
  isOnPaper?: boolean;
};

const TagInputPreview = ({
  initialTags = INITIAL_TAGS,
  initialSelectedIDs = ["react"],
  isOnPaper = false,
}: TagInputPreviewProps) => {
  const [options, setOptions] = useState(initialTags);
  const [selectedIDs, setSelectedIDs] = useState<string[]>(initialSelectedIDs);

  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "min(640px, 100%)",
        ...(isOnPaper && {
          padding: 24,
          borderRadius: 25,
          background: "var(--paper-color)",
        }),
      }}
    >
      <TagInput
        heading="タグ"
        tags={options.filter((tag) => selectedIDs.includes(tag.id))}
        allTagOptions={options}
        onAddTag={(tagID) => setSelectedIDs((current) => [...current, tagID])}
        onCreateTag={async (name) => {
          const existing = options.find((tag) => tag.name === name);
          if (existing) {
            setSelectedIDs((current) => [
              ...new Set([...current, existing.id]),
            ]);
            return true;
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
          return true;
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox", {
      name: "作品に付けるタグを探す",
    });
    const clearButton = canvas.getByRole("button", {
      name: "タグの入力をクリア",
    });
    await expect(clearButton).toBeDisabled();
    await userEvent.type(input, "react");
    const counter = canvas.getByText("5/50");
    const surface = input.parentElement;
    if (!surface) throw new Error("入力欄の枠が見つかりません");
    const surfaceRect = surface.getBoundingClientRect();
    await expect(surfaceRect.height).toBeCloseTo(36, 3);
    await expect(
      canvas
        .getByRole("button", { name: "タグを新規作成" })
        .getBoundingClientRect().height,
    ).toBeCloseTo(36, 3);
    await expect(
      canvas
        .getByRole("radiogroup", { name: "タグの並び順" })
        .getBoundingClientRect().height,
    ).toBeCloseTo(36, 3);
    const buttonRect = clearButton.getBoundingClientRect();
    await expect(buttonRect.right).toBeLessThan(surfaceRect.right);
    await expect(buttonRect.left).toBeGreaterThan(
      counter.getBoundingClientRect().right,
    );
    await userEvent.click(clearButton);
    await expect(input).toHaveValue("");
    await expect(input).toHaveFocus();
    await expect(canvas.getByText("0/50")).toBeVisible();
  },
};

export const ManyTagsOnPaper: Story = {
  render: () => (
    <TagInputPreview
      initialTags={MANY_TAGS}
      initialSelectedIDs={["tag-2", "tag-5"]}
      isOnPaper
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox", {
      name: "作品に付けるタグを探す",
    });
    const expandButton = await canvas.findByRole("button", {
      name: "すべてのタグ",
    });
    const listID = expandButton.getAttribute("aria-controls");
    const list = listID ? document.getElementById(listID) : null;
    const unit = list?.parentElement;
    if (!list || !unit) throw new Error("タグ一覧が見つかりません");
    const rowTops = [
      ...new Set(
        Array.from(list.children).map(
          (item) => (item as HTMLElement).offsetTop,
        ),
      ),
    ];
    await expect(rowTops.length).toBeGreaterThan(4);
    const fourthRow = Array.from(list.children).find(
      (item) => (item as HTMLElement).offsetTop === rowTops[3],
    ) as HTMLElement;
    await expect(unit.getBoundingClientRect().height).toBe(
      fourthRow.offsetTop - rowTops[0] + fourthRow.offsetHeight,
    );

    await userEvent.click(expandButton);
    await expect(unit).toHaveAttribute("data-expanded", "true");
    await expect(list.getBoundingClientRect().height).toBeLessThanOrEqual(280);
    const sortToggle = canvas.queryByRole("button", { name: /タグの並び順/ });
    const controls = [
      sortToggle ?? canvas.getByRole("radiogroup", { name: "タグの並び順" }),
      input,
      canvas.getByRole("button", { name: "タグを新規作成" }),
      canvas.getByRole("button", { name: "選択中の2件のタグをクリア" }),
    ];
    for (const control of controls) {
      await waitFor(() => expect(control).toBeVisible());
      const rect = control.getBoundingClientRect();
      await expect(
        control.contains(
          document.elementFromPoint(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
          ),
        ),
      ).toBe(true);
    }
    await userEvent.click(input);
    await expect(unit).toHaveAttribute("data-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(unit).toHaveAttribute("data-expanded", "false");
    await userEvent.type(input, "#");
    await expect(unit).toHaveAttribute("data-expanded", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "タグの入力をクリア" }),
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.click(sortToggle ?? canvas.getByText("名前順"));
    await expect(unit).toHaveAttribute("data-expanded", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "選択中の2件のタグをクリア" }),
    );
    await expect(unit).toHaveAttribute("data-expanded", "true");
    await expect(
      canvas.getByRole("button", { name: "選択中のタグはありません" }),
    ).toBeDisabled();
    const backdrop = unit.parentElement?.parentElement?.querySelector(
      ':scope > [aria-hidden="true"]',
    );
    if (!(backdrop instanceof HTMLElement))
      throw new Error("タグパネルの背景が見つかりません");
    await userEvent.click(backdrop);
    await waitFor(() => expect(unit).toHaveAttribute("data-expanded", "false"));
  },
};
