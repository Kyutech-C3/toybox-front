import { act, useEffect } from "react";
import {
  expect,
  fireEvent,
  spyOn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import ImageUpload from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useWorkEditorStore } from "@/features/WorkEditor/store/useWorkEditorStore";
import WorkEditorStoreProvider from "@/features/WorkEditor/store/WorkEditorStoreProvider";
import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createGifFixture } from "@/stories/gifFixture";
import {
  deferImageEncoding,
  findImageEditor,
} from "@/stories/imageEditorHelpers";
import { createImageFixture } from "@/stories/imageFixture";

import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";

const ResetEditor = () => {
  const resetEditor = useWorkEditorStore((state) => state.resetEditor);
  return (
    <Button variant="secondary" onClick={resetEditor}>
      編集をリセット
    </Button>
  );
};

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

export const SavedImageCannotBeEdited: Story = {
  render: () => <SavedThumbnail />,
};

export const SelectAndEdit: Story = {
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
      let dialog = await findImageEditor(canvasElement, "GIF保存");
      await expect(uploads.files).toHaveLength(0);
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
      await userEvent.upload(input, source);
      dialog = await findImageEditor(canvasElement, "GIF保存");
      await fireEvent.change(dialog.getByRole("slider"), {
        target: { value: "2" },
      });
      await userEvent.click(dialog.getByRole("button", { name: "GIF保存" }));
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      await expect(uploads.files).toHaveLength(1);
      await expect([uploads.files[0].name, uploads.files[0].type]).toEqual([
        "animation.gif",
        "image/gif",
      ]);
      const edit = canvas.getByRole("button", { name: "サムネイル画像を編集" });
      await userEvent.click(edit);
      dialog = await findImageEditor(canvasElement, "静止画保存");
      await waitFor(() =>
        expect(
          Number((dialog.getByRole("slider") as HTMLInputElement).value),
        ).toBeCloseTo(2, 1),
      );
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await expect(uploads.files).toHaveLength(1);
      await expect(edit).toHaveFocus();
      await userEvent.click(edit);
      dialog = await findImageEditor(canvasElement, "静止画保存");
      await userEvent.click(dialog.getByRole("button", { name: "静止画保存" }));
      await waitFor(() => expect(uploads.files).toHaveLength(2));
      await expect([uploads.files[1].name, uploads.files[1].type]).toEqual([
        "animation.webp",
        "image/webp",
      ]);
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "animation.webpを削除" }),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      uploads.restore();
    }
  },
};

export const ResetDuringEncoding: Story = {
  tags: ["test"],
  render: () => (
    <>
      <ImageUpload />
      <ResetEditor />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const encoding = deferImageEncoding();
    const uploads = mockUploads();
    try {
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(160, 120),
      );
      const dialog = await findImageEditor(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await encoding.waitForStart();
      // dialog 外の操作なので、userEvent ではなく外部 reset を直接再現する。
      await act(() =>
        canvas.getByRole("button", { name: "編集をリセット" }).click(),
      );
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await encoding.complete();
      await expect(uploads.files).toHaveLength(0);
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      encoding.restore();
      uploads.restore();
    }
  },
};
