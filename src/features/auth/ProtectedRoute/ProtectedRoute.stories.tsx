import { MemoryRouter } from "react-router-dom";

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
};

export const Authenticated: Story = {
  beforeEach: () => useAuthStore.setState({ accessToken: "storybook-token" }),
};
