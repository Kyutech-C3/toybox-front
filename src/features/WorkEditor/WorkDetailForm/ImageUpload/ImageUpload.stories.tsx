import { expect, userEvent, waitFor, within } from "storybook/test";

import ImageUpload from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useWorkEditorStore } from "@/features/WorkEditor/store/useWorkEditorStore";
import WorkEditorStoreProvider from "@/features/WorkEditor/store/WorkEditorStoreProvider";
import Button from "@/shared/ui/Button";
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
  return (
    <Button
      variant="secondary"
      onClick={() =>
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
        })
      }
    >
      保存済みサムネイルを表示
    </Button>
  );
};

const META = {
  title: "Features/WorkEditor/ImageUpload",
  component: ImageUpload,
  decorators: [
    (Story) => (
      <WorkEditorStoreProvider>
        <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
          <Story />
          <ResetEditor />
          <SavedThumbnail />
        </div>
      </WorkEditorStoreProvider>
    ),
  ],
  beforeEach: () => {
    useAuthStore.setState({ accessToken: "storybook-token" });
  },
} satisfies Meta<typeof ImageUpload>;
export default META;
type Story = StoryObj<typeof META>;

export const AutoCropAndEdit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const originalFetch = globalThis.fetch;
    const uploads: File[] = [];
    globalThis.fetch = async (resource, init) => {
      if (String(resource).endsWith("/auth/works/asset")) {
        const file =
          init?.body instanceof FormData ? init.body.get("file") : null;
        if (!(file instanceof File)) throw new Error("No upload file");
        uploads.push(file);
        return new Response(
          JSON.stringify({
            id: `asset-${uploads.length}`,
            url: "https://example.test/thumbnail.webp",
          }),
          { status: 200 },
        );
      }
      return originalFetch(resource, init);
    };
    try {
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(2400, 1600),
      );
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
      await expect(uploads).toHaveLength(1);
      const bitmap = await createImageBitmap(uploads[0]);
      await expect([bitmap.width, bitmap.height]).toEqual([1600, 1200]);
      bitmap.close();
      const edit = canvas.getByRole("button", { name: "サムネイル画像を編集" });
      await expect(edit.querySelector("svg")).not.toBeNull();
      await expect(edit).toHaveTextContent("");
      const preview =
        edit.parentElement?.parentElement?.getBoundingClientRect();
      const button = edit.getBoundingClientRect();
      if (!preview) throw new Error("No thumbnail preview");
      await expect(Math.abs(button.left - preview.left - 8)).toBeLessThan(1);
      await expect(Math.abs(preview.bottom - button.bottom - 8)).toBeLessThan(
        1,
      );
      await userEvent.click(edit);
      let dialog = within(await body.findByRole("dialog"));
      await expect(
        await dialog.findByText("元画像: 2400 × 1600px"),
      ).toBeVisible();
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await expect(uploads).toHaveLength(1);
      await expect(edit).toBeVisible();
      await userEvent.click(edit);
      dialog = within(await body.findByRole("dialog"));
      await userEvent.click(dialog.getByRole("radio", { name: "1:1" }));
      await userEvent.click(dialog.getByRole("button", { name: "1024px" }));
      await waitFor(() =>
        expect(dialog.getByText("出力: 1024 × 1024px")).toBeVisible(),
      );
      await userEvent.click(dialog.getByRole("button", { name: "適用" }));
      await waitFor(() => expect(uploads).toHaveLength(2));
      const editedBitmap = await createImageBitmap(uploads[1]);
      await expect([editedBitmap.width, editedBitmap.height]).toEqual([
        1024, 1024,
      ]);
      editedBitmap.close();
      await waitFor(() => expect(edit).toBeEnabled());
      await userEvent.click(
        canvas.getByRole("button", { name: "保存済みサムネイルを表示" }),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
      await userEvent.click(
        canvas.getByRole("button", { name: "編集をリセット" }),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};

export const SavedImageHasNoEditButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "保存済みサムネイルを表示" }),
    );
    await expect(
      await canvas.findByRole("img", { name: "サムネイル画像のプレビュー" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
    ).not.toBeInTheDocument();
  },
};

export const ResetDuringEncoding: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const source = await createImageFixture(160, 120);
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalFetch = globalThis.fetch;
    const encoding: { complete?: () => Promise<void> } = {};
    let encodingCount = 0;
    let uploadCount = 0;
    globalThis.fetch = (resource, init) => {
      if (String(resource).endsWith("/auth/works/asset")) {
        uploadCount += 1;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "stale",
              url: "https://example.test/stale.webp",
            }),
            { status: 200 },
          ),
        );
      }
      return originalFetch(resource, init);
    };
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (type !== "image/webp") {
        originalToBlob.call(this, callback, type, quality);
        return;
      }
      encodingCount += 1;
      encoding.complete = () =>
        new Promise<void>((resolve) => {
          originalToBlob.call(
            this,
            (blob) => {
              callback(blob);
              resolve();
            },
            type,
            quality,
          );
        });
    };
    try {
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        source,
      );
      await waitFor(() => expect(encodingCount).toBe(1));
      // 外部の reset 後に画像処理が完了しても、古い画像をアップロードしない。
      canvas.getByRole("button", { name: "編集をリセット" }).click();
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await encoding.complete?.();
      await expect(uploadCount).toBe(0);
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
      globalThis.fetch = originalFetch;
    }
  },
};

export const LowResolutionAutoUpload: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalFetch = globalThis.fetch;
    const uploads: File[] = [];
    globalThis.fetch = async (resource, init) => {
      if (String(resource).endsWith("/auth/works/asset")) {
        const file =
          init?.body instanceof FormData ? init.body.get("file") : null;
        if (!(file instanceof File)) throw new Error("No upload file");
        uploads.push(file);
        return new Response(
          JSON.stringify({
            id: "small",
            url: "https://example.test/small.webp",
          }),
          { status: 200 },
        );
      }
      return originalFetch(resource, init);
    };
    try {
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(160, 120),
      );
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      const bitmap = await createImageBitmap(uploads[0]);
      await expect([bitmap.width, bitmap.height]).toEqual([160, 120]);
      bitmap.close();
      await userEvent.click(
        canvas.getByRole("button", { name: "photo.webpを削除" }),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};
