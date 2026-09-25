import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Pagination } from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const PaginationWithState = ({ initialPage = 1, totalPages = 10 }) => {
  const [page, setPage] = useState(initialPage);
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
};

const META = {
  title: "UI/Pagination",
  component: Pagination,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { currentPage: 1, totalPages: 10, onPageChange: () => undefined },
} satisfies Meta<typeof Pagination>;

export default META;
type Story = StoryObj<typeof META>;

export const FewPages: Story = {
  render: () => <PaginationWithState totalPages={3} />,
};

export const ManyPages: Story = {
  render: () => <PaginationWithState initialPage={5} totalPages={12} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button", {
      name: "隠れたページを表示",
    });
    await userEvent.click(triggers[0]);
    await userEvent.click(canvas.getByRole("option", { name: "2" }));
    await expect(
      canvas.getByRole("button", { name: "ページ 2" }),
    ).toHaveAttribute("data-active", "true");
  },
};
