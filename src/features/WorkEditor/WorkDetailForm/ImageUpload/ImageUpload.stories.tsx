import { useEffect } from "react";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";

import ImageUpload from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useWorkEditorStore } from "@/features/WorkEditor/store/useWorkEditorStore";
import WorkEditorStoreProvider from "@/features/WorkEditor/store/WorkEditorStoreProvider";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createGifFixture } from "@/stories/gifFixture";

import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";

const SavedThumbnail = () => {
  const setThumbnail = useWorkEditorStore((state) => state.setThumbnail);
  useEffect(() => {
    setThumbnail({
      key: "asset:saved",
      assetID: "saved",
      assetURL: "/favicon-64x64.png",
      previewURL: "/favicon-64x64.png",
      fileName: "saved.png",
      kind: "画像",
      status: "success",
      file: null,
      errorMessage: "",
    });
  }, [setThumbnail]);
  return <ImageUpload />;
};

const META = {
  title: "Features/WorkEditor/ImageUpload",
  component: ImageUpload,
  decorators: [
    (Story) => (
      <ToastProvider>
        <WorkEditorStoreProvider>
          <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
            <Story />
          </div>
        </WorkEditorStoreProvider>
      </ToastProvider>
    ),
  ],
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "storybook-token" });
  },
} satisfies Meta<typeof ImageUpload>;
export default META;
type Story = StoryObj<typeof META>;

const mockUploads = () => {
  const originalFetch = globalThis.fetch;
  const files: File[] = [];
  const request = spyOn(globalThis, "fetch").mockImplementation(
    async (resource, init) => {
      if (!String(resource).endsWith("/auth/works/asset"))
        return originalFetch(resource, init);
      const file =
        init?.body instanceof FormData ? init.body.get("file") : null;
      if (!(file instanceof File)) throw new Error("No upload file");
      files.push(file);
      return new Response(
        JSON.stringify({
          id: `asset-${files.length}`,
          url: "/favicon-64x64.png",
        }),
        { status: 200 },
      );
    },
  );
  return { files, restore: () => request.mockRestore() };
};

export const Default: Story = {};

export const SavedImage: Story = {
  render: () => <SavedThumbnail />,
};

export const SelectAndUpload: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(
      "サムネイル画像をアップロードのファイル選択",
    );
    const source = createGifFixture().file;
    const uploads = mockUploads();
    try {
      await userEvent.upload(input, source);
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      await expect(uploads.files).toHaveLength(1);
      await expect([uploads.files[0].name, uploads.files[0].type]).toEqual([
        source.name,
        source.type,
      ]);
      await expect(
        new Uint8Array(await uploads.files[0].arrayBuffer()),
      ).toEqual(new Uint8Array(await source.arrayBuffer()));
      await expect(
        within(canvasElement.ownerDocument.body).queryByRole("dialog"),
      ).not.toBeInTheDocument();
      await userEvent.click(
        canvas.getByRole("button", { name: `${source.name}を削除` }),
      );
      await expect(
        canvas.queryByRole("img", { name: "サムネイル画像のプレビュー" }),
      ).not.toBeInTheDocument();
    } finally {
      uploads.restore();
    }
  },
};
