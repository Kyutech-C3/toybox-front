import { useState } from "react";

import EditorModeTabs from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { EditorMode } from "../types";

const StatefulTabs = () => {
  const [mode, setMode] = useState<EditorMode>("edit");
  return (
    <>
      <EditorModeTabs mode={mode} panelID="story-panel" onChange={setMode} />
      <div id="story-panel" role="tabpanel" aria-label={`${mode}の内容`} />
    </>
  );
};

const META = {
  title: "Features/WorkEditor/EditorModeTabs",
  component: EditorModeTabs,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { mode: "edit", panelID: "story-panel", onChange: () => undefined },
} satisfies Meta<typeof EditorModeTabs>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {
  render: () => <StatefulTabs />,
};
