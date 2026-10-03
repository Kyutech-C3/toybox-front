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

const META = {
  title: "Features/WorkEditor/ImageUpload",
  component: ImageUpload,
  decorators: [
    (Story) => (
      <WorkEditorStoreProvider>
        <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
          <Story />
          <ResetEditor />
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

export const UploadAfterEditing: Story = {
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
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(1600, 1200),
      );
      let dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "適用" })).toBeEnabled(),
      );
      await expect(uploads).toHaveLength(0);
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await expect(uploads).toHaveLength(0);
      await expect(
        canvas.queryByText("アップロード完了"),
      ).not.toBeInTheDocument();
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(1600, 1200),
      );
      dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "適用" })).toBeEnabled(),
      );
      await userEvent.click(dialog.getByRole("button", { name: "512px" }));
      await userEvent.click(dialog.getByRole("button", { name: "適用" }));
      await waitFor(() =>
        expect(canvas.getByText("アップロード完了")).toBeVisible(),
      );
      await expect(uploads).toHaveLength(1);
      const bitmap = await createImageBitmap(uploads[0]);
      await expect([bitmap.width, bitmap.height]).toEqual([512, 384]);
      bitmap.close();
      await userEvent.click(canvas.getByRole("button", { name: "画像を編集" }));
      dialog = within(await body.findByRole("dialog"));
      // 再編集時には元画像を使い、前回の縮小で解像度を失わない。
      await expect(
        await dialog.findByText("元画像: 1600 × 1200px"),
      ).toBeVisible();
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
      await waitFor(() =>
        expect(
          canvas.getByRole("button", { name: "画像を編集" }),
        ).toBeEnabled(),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "編集をリセット" }),
      );
      await expect(
        canvas.queryByText("アップロード完了"),
      ).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};

export const ResetDuringEncoding: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.upload(
      canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
      await createImageFixture(160, 120),
    );
    const dialog = within(await body.findByRole("dialog"));
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "適用" })).toBeEnabled(),
    );
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
      const apply = dialog.getByRole("button", { name: "適用" });
      await userEvent.click(apply);
      apply.click();
      await expect(encodingCount).toBe(1);
      // 外部の reset 後に画像処理が完了しても、古い画像をアップロードしない。
      canvas.getByRole("button", { name: "編集をリセット" }).click();
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await encoding.complete?.();
      await expect(uploadCount).toBe(0);
      await expect(
        canvas.queryByRole("button", { name: "画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
      globalThis.fetch = originalFetch;
    }
  },
};
