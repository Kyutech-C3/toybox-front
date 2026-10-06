import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { SWRConfig, unstable_serialize } from "swr";

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
                    fallback: {
                      [unstable_serialize(["/tags", "storybook-token"])]: {
                        tags: [],
                      },
                    },
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
        icon_url: "",
      },
      hasLoadFailed: false,
    });
  },
} satisfies Meta<typeof WorkEditor>;

export default META;
type Story = StoryObj<typeof META>;

export const NewWork: Story = {};

export const ValidationErrors: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /下書き保存/ }));
    for (const message of [
      "タイトルを入力してください",
      "説明を入力してください",
      "タグを1つ以上指定してください",
      "サムネイルを追加し、アップロードを完了してください",
      "アセットを1つ以上追加してください",
    ]) {
      await expect(canvas.getByText(message)).toBeVisible();
    }
    const title = canvas.getByRole("textbox", { name: "タイトル" });
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(title, "あ".repeat(101));
    await expect(title).toHaveValue("あ".repeat(100));
    await expect(canvas.getByText("100/100")).toBeVisible();
    await userEvent.clear(title);
    await userEvent.type(title, "😀".repeat(100));
    await expect(canvas.getByText("100/100")).toBeVisible();
    await expect(title).toHaveAttribute("aria-invalid", "false");
    await expect(
      canvas.queryByText("タイトルは100文字以内で入力してください"),
    ).not.toBeInTheDocument();
    const description = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.type(description, "作品の説明");
    await expect(description).toHaveAttribute("aria-invalid", "false");
    await expect(
      canvas.queryByText("説明を入力してください"),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByText("作品の説明", { selector: "p" }),
    ).toBeVisible();
  },
};
