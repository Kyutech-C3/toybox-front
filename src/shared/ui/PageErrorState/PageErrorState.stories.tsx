import { MemoryRouter } from "react-router-dom";
import { expect, fn, userEvent, within } from "storybook/test";

import PageErrorState from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/PageErrorState",
  component: PageErrorState,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
  args: {
    title: "作品を読み込めませんでした",
    description: "通信状態を確認して、もう一度お試しください。",
    actions: [
      { id: "retry", type: "button", label: "再試行", onClick: fn() },
      { id: "home", type: "link", label: "トップへ戻る", to: "/" },
    ],
  },
} satisfies Meta<typeof PageErrorState>;

export default META;
type Story = StoryObj<typeof META>;

export const Page: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "再試行" }));
    await expect(
      args.actions[0]?.type === "button" && args.actions[0].onClick,
    ).toHaveBeenCalled();
  },
};

export const Section: Story = { args: { layout: "section" } };

export const NotFound: Story = {
  args: {
    title: "ページが見つかりません",
    description: undefined,
    actions: [{ id: "home", type: "link", label: "トップへ戻る", to: "/" }],
  },
};
