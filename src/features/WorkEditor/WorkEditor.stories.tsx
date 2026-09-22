import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { SWRConfig } from "swr";

import WorkEditor from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/WorkEditor",
  component: WorkEditor,
  decorators: [
    (Story) => {
      const router = createMemoryRouter(
        [
          {
            path: "/edit/new",
            element: (
              <ToastProvider>
                <SWRConfig
                  value={{
                    fallback: { "/tags": { tags: [] } },
                    provider: () => new Map(),
                  }}
                >
                  <Story />
                </SWRConfig>
              </ToastProvider>
            ),
          },
        ],
        { initialEntries: ["/edit/new"] },
      );
      return <RouterProvider router={router} />;
    },
  ],
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { workID: null },
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "storybook-token" });
    useUserStore.setState({
      user: {
        id: "owner",
        display_name: "Storybook User",
        icon_url: "/comingSoonLugia.webp",
      },
      hasLoadFailed: false,
    });
  },
} satisfies Meta<typeof WorkEditor>;

export default META;
type Story = StoryObj<typeof META>;

export const NewWork: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "タイトル" }),
    ).toBeVisible();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "タイトル" }),
      "新しい作品",
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByText("プレビューする内容がありません"),
    ).toBeVisible();
  },
};
