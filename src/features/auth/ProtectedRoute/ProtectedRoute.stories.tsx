import { MemoryRouter } from "react-router-dom";
import { expect, within } from "storybook/test";

import { useAuthStore } from "../store/useAuthStore";
import ProtectedRoute from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Auth/ProtectedRoute",
  component: ProtectedRoute,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
  args: { children: <p>認証済みの内容</p> },
} satisfies Meta<typeof ProtectedRoute>;

export default META;
type Story = StoryObj<typeof META>;

export const LoginRequired: Story = {
  beforeEach: () => useAuthStore.setState({ accessToken: null }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      "ログインが必要です",
    );
  },
};

export const Authenticated: Story = {
  beforeEach: () => useAuthStore.setState({ accessToken: "storybook-token" }),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("認証済みの内容"),
    ).toBeVisible();
  },
};
