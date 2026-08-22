import Toast from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    message: "お知らせがあります",
    severity: "info",
    autoHideDuration: null,
    onClose: () => undefined,
  },
};

export default META;
type Story = StoryObj<typeof META>;

export const Success: Story = {
  args: {
    message: "処理が完了しました",
    severity: "success",
  },
};

export const Info: Story = {};

export const Warning: Story = {
  args: {
    message: "入力内容を確認してください",
    severity: "warning",
  },
};

export const ErrorToast: Story = {
  args: {
    message: "処理に失敗しました",
    severity: "error",
  },
};
