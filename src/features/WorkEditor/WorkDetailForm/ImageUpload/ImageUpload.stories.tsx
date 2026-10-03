import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import ImageUpload from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useWorkEditorStore } from "@/features/WorkEditor/store/useWorkEditorStore";
import WorkEditorStoreProvider from "@/features/WorkEditor/store/WorkEditorStoreProvider";
import Button from "@/shared/ui/Button";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
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
      <ToastProvider>
        <WorkEditorStoreProvider>
          <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
            <Story />
            <ResetEditor />
            <SavedThumbnail />
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

const getDialog = async (canvasElement: HTMLElement) => {
  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog"),
  );
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
  );
  return dialog;
};

export const SelectAndEdit: Story = {
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
      let selectedDialog = await getDialog(canvasElement);
      await expect(uploads).toHaveLength(0);
      await userEvent.click(
        selectedDialog.getByRole("button", { name: "キャンセル" }),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(2400, 1600),
      );
      selectedDialog = await getDialog(canvasElement);
      await userEvent.click(
        selectedDialog.getByRole("button", { name: "保存" }),
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
      const remove = canvas.getByRole("button", { name: "photo.webpを削除" });
      const errorColor = document.createElement("span");
      errorColor.style.color = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--error-color");
      for (const property of [
        "width",
        "height",
        "backgroundColor",
        "borderColor",
        "borderRadius",
        "boxShadow",
        "fontSize",
      ] as const) {
        await expect(getComputedStyle(remove)[property]).toBe(
          getComputedStyle(edit)[property],
        );
      }
      await expect(getComputedStyle(remove).color).toBe(errorColor.style.color);
      await userEvent.hover(remove);
      const hoveredRemove = getComputedStyle(remove).backgroundColor;
      await expect(getComputedStyle(remove).color).toBe(errorColor.style.color);
      await userEvent.hover(edit);
      await expect(hoveredRemove).toBe(getComputedStyle(edit).backgroundColor);
      await userEvent.unhover(edit);
      const preview = edit.parentElement?.getBoundingClientRect();
      const button = edit.getBoundingClientRect();
      if (!preview) throw new Error("No thumbnail preview");
      await expect(Math.abs(button.left - preview.left - 8)).toBeLessThan(1);
      await expect(Math.abs(preview.bottom - button.bottom - 8)).toBeLessThan(
        1,
      );
      await userEvent.click(edit);
      let dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
      );
      await expect(
        dialog
          .getByLabelText("画像の切り抜き位置")
          .parentElement?.querySelector("img")?.naturalWidth,
      ).toBe(2400);
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      await expect(uploads).toHaveLength(1);
      await expect(edit).toHaveFocus();
      await userEvent.click(edit);
      dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
      );
      await fireEvent.change(dialog.getByRole("slider"), {
        target: { value: "2" },
      });
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() => expect(uploads).toHaveLength(2));
      const editedBitmap = await createImageBitmap(uploads[1]);
      await expect([editedBitmap.width, editedBitmap.height]).toEqual([
        1067, 800,
      ]);
      editedBitmap.close();
      await waitFor(() => expect(edit).toBeEnabled());
      await userEvent.click(edit);
      dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(
          Number((dialog.getByRole("slider") as HTMLInputElement).value),
        ).toBeCloseTo(2, 1),
      );
      await expect(
        dialog
          .getByLabelText("画像の切り抜き位置")
          .parentElement?.querySelector("img")?.naturalWidth,
      ).toBe(2400);
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
      const input = canvas.getByLabelText(
        "サムネイル画像をアップロードのファイル選択",
      );
      let selectionCount = 0;
      const handleSelectClick = (event: Event) => {
        event.preventDefault();
        selectionCount += 1;
      };
      input.addEventListener("click", handleSelectClick);
      await userEvent.click(
        canvas.getByRole("button", { name: "サムネイル画像をアップロード" }),
      );
      input.removeEventListener("click", handleSelectClick);
      await expect(selectionCount).toBe(1);
      await userEvent.upload(input, await createImageFixture(160, 120));
      const replacementDialog = await getDialog(canvasElement);
      await expect(uploads).toHaveLength(2);
      await userEvent.click(
        replacementDialog.getByRole("button", { name: "保存" }),
      );
      await waitFor(() => expect(uploads).toHaveLength(3));
      await waitFor(() => expect(edit).toBeEnabled());
      await userEvent.click(edit);
      dialog = within(await body.findByRole("dialog"));
      await waitFor(() =>
        expect(dialog.getByRole("button", { name: "保存" })).toBeEnabled(),
      );
      await expect(dialog.getByRole("slider")).toHaveValue("1");
      await expect(
        dialog
          .getByLabelText("画像の切り抜き位置")
          .parentElement?.querySelector("img")?.naturalWidth,
      ).toBe(160);
      await userEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
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

export const SavedImageCannotBeEdited: Story = {
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
    await expect(
      canvas.getByRole("button", { name: "サムネイル画像をアップロード" }),
    ).toBeEnabled();
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog"),
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
      const dialog = await getDialog(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
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

export const LowResolutionUpload: Story = {
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
      const dialog = await getDialog(canvasElement);
      await expect(uploads).toHaveLength(0);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
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

export const ResetDuringLocalImageEditing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? Promise.resolve(
            new Response(
              JSON.stringify({ id: "local", url: "/favicon-64x64.png" }),
              { status: 200 },
            ),
          )
        : originalFetch(resource, init);
    try {
      await userEvent.upload(
        canvas.getByLabelText("サムネイル画像をアップロードのファイル選択"),
        await createImageFixture(160, 120),
      );
      const dialog = await getDialog(canvasElement);
      await userEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(
          canvas.getByRole("button", { name: "サムネイル画像を編集" }),
        ).toBeEnabled(),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "サムネイル画像を編集" }),
      );
      await body.findByRole("dialog");
      canvas.getByRole("button", { name: "編集をリセット" }).click();
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await expect(
        canvas.queryByRole("button", { name: "サムネイル画像を編集" }),
      ).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};
