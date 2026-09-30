import { useState } from "react";

import SplitButton from "./index";

import VisibilityIcon, {
  VISIBILITY_TEXT_LABELS,
} from "@/shared/ui/VisibilityIcon";

import type { Meta, StoryObj } from "@storybook/react";
import type { WorkVisibility } from "@/shared/types/work";

const OPTIONS = (["public", "private", "draft"] as const).map((value) => ({
  id: value,
  value,
  label: VISIBILITY_TEXT_LABELS[value],
  icon: <VisibilityIcon visibility={value} />,
}));

const SplitButtonPreview = () => {
  const [visibility, setVisibility] = useState<WorkVisibility>("public");
  return (
    <SplitButton
      label={
        visibility === "draft"
          ? "下書き保存"
          : VISIBILITY_TEXT_LABELS[visibility]
      }
      icon={<VisibilityIcon visibility={visibility} />}
      variant={visibility === "draft" ? "primary" : "accent"}
      onClick={() => {}}
      menuTriggerLabel="保存形式を選択"
      menuLabel="保存形式"
      options={OPTIONS}
      selectedValue={visibility}
      onSelect={setVisibility}
    />
  );
};

const META: Meta<typeof SplitButton> = {
  title: "UI/SplitButton",
  component: SplitButton,
  parameters: { layout: "centered" },
};

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  render: () => <SplitButtonPreview />,
};
