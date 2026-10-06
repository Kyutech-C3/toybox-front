import ActionBar from "./index";

import Button from "@/shared/ui/Button";
import SplitButton from "@/shared/ui/SplitButton";
import VisibilityIcon, {
  VISIBILITY_TEXT_LABELS,
} from "@/shared/ui/VisibilityIcon";

import type { Meta, StoryObj } from "@storybook/react";

const EditorActions = () => (
  <ActionBar>
    <Button>キャンセル</Button>
    <Button variant="destructive">削除</Button>
    <SplitButton
      label={VISIBILITY_TEXT_LABELS.public}
      icon={<VisibilityIcon visibility="public" />}
      onClick={() => {}}
      menuTriggerLabel="保存形式を選択"
      menuLabel="保存形式"
      options={[
        { id: "public", value: "public", label: VISIBILITY_TEXT_LABELS.public },
        { id: "draft", value: "draft", label: VISIBILITY_TEXT_LABELS.draft },
      ]}
      selectedValue="public"
      onSelect={() => {}}
    />
  </ActionBar>
);

const META = {
  title: "UI/ActionBar",
  component: EditorActions,
} satisfies Meta<typeof EditorActions>;

export default META;
type Story = StoryObj<typeof META>;

export const EditorLike: Story = {};
