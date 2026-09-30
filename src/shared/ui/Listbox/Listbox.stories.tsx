import { useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import Listbox from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const ListboxExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("public");
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ position: "relative", minHeight: 280 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        公開範囲: {value}
      </button>
      <Listbox
        id="visibility-listbox-story"
        isOpen={isOpen}
        options={[
          { id: "public", value: "public", label: "全体公開" },
          { id: "private", value: "private", label: "限定公開" },
          { id: "draft", value: "draft", label: "下書き" },
        ]}
        selectedValue={value}
        triggerRef={triggerRef}
        onSelect={setValue}
        onClose={() => setIsOpen(false)}
        ariaLabel="公開範囲"
        placement="bottom"
      />
    </div>
  );
};

const META = {
  title: "UI/Listbox",
  component: Listbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    id: "listbox",
    isOpen: false,
    options: [],
    onSelect: () => undefined,
    onClose: () => undefined,
    triggerRef: { current: null },
    ariaLabel: "選択肢",
  },
} satisfies Meta<typeof Listbox>;

export default META;
type Story = StoryObj<typeof META>;

export const Interactive: Story = {
  render: () => <ListboxExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /公開範囲/ });
    await userEvent.click(trigger);
    await userEvent.keyboard("{End}{Enter}");
    await expect(trigger).toHaveTextContent("draft");
    await expect(trigger).toHaveFocus();
  },
};
