import Popover, { PopoverButton, PopoverLabel } from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: 280, minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

export const Menu: Story = {
  args: {
    id: "menu-popover",
    isOpen: true,
    onClose: () => {},
    role: "menu",
    ariaLabel: "アカウントメニュー",
    align: "start",
    children: (
      <>
        <PopoverLabel>ユーザー名</PopoverLabel>
        <PopoverButton>マイページ</PopoverButton>
        <PopoverButton>ログアウト</PopoverButton>
      </>
    ),
  },
};

export const Listbox: Story = {
  args: {
    id: "listbox-popover",
    isOpen: true,
    onClose: () => {},
    role: "listbox",
    ariaLabel: "保存形式",
    align: "start",
    textAlign: "center",
    children: (
      <>
        <PopoverButton role="option" isSelected>
          全体公開
        </PopoverButton>
        <PopoverButton role="option">限定公開</PopoverButton>
        <PopoverButton role="option" disabled>
          下書き
        </PopoverButton>
      </>
    ),
  },
};
