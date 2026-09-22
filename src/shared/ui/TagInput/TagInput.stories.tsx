import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import TagInput from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { TagInputTag } from "./index";

type TagInputWithStateProps = {
  hasFailure?: boolean;
};

const TagInputWithState = ({ hasFailure = false }: TagInputWithStateProps) => {
  const [tags, setTags] = useState<TagInputTag[]>([
    { id: "tag-1", name: "React" },
  ]);
  return (
    <div style={{ width: 480 }}>
      <TagInput
        tags={tags}
        allTagOptions={["React", "TypeScript", "Three.js", "電子工作"]}
        failedTags={hasFailure ? ["作成失敗"] : []}
        errorMessage={hasFailure ? "タグを作成できませんでした" : undefined}
        onAddTag={(name) =>
          setTags((current) => [...current, { id: `tag-${name}`, name }])
        }
        onRemoveTag={(id) =>
          setTags((current) => current.filter((tag) => tag.id !== id))
        }
        onRetryTag={() => undefined}
        onRemoveFailedTag={() => undefined}
        heading="タグ"
        aria-label="タグを追加"
        placeholder="タグを入力"
      />
    </div>
  );
};

const META = {
  title: "UI/TagInput",
  component: TagInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    tags: [],
    onAddTag: () => undefined,
    onRemoveTag: () => undefined,
  },
} satisfies Meta<typeof TagInput>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  render: () => <TagInputWithState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "タグを追加" });
    await userEvent.type(input, "type");
    await userEvent.click(canvas.getByRole("option", { name: "TypeScript" }));
    await expect(canvas.getByText("TypeScript")).toBeInTheDocument();
  },
};

export const FailedTag: Story = {
  render: () => <TagInputWithState hasFailure />,
};
