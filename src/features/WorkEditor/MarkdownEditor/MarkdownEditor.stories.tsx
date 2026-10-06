import { useEffect } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { useWorkEditorStoreApi } from "../store/useWorkEditorStore";
import WorkEditorStoreProvider from "../store/WorkEditorStoreProvider";
import AssetUpload from "../WorkDetailForm/AssetUpload";
import MarkdownEditor from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { Meta, StoryObj } from "@storybook/react";
import type { EditorAsset } from "../types";
import type { EditorMode } from "./types";

const META = {
  title: "Features/WorkEditor/MarkdownEditor",
  component: MarkdownEditor,
  decorators: [
    (Story) => (
      <WorkEditorStoreProvider>
        <div style={{ width: "min(900px, 95vw)" }}>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </div>
      </WorkEditorStoreProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownEditor>;

export default META;
type Story = StoryObj<typeof META>;

type ImageInsertionExampleProps = {
  description?: string;
  isUploadVisible?: boolean;
  hasSecondImage?: boolean;
  initialMode?: EditorMode;
};

const ImageInsertionExample = ({
  description = "",
  isUploadVisible = false,
  hasSecondImage = false,
  initialMode = "edit",
}: ImageInsertionExampleProps) => {
  const store = useWorkEditorStoreApi();
  useEffect(() => {
    if (store.getState().current.assets.length > 0) return;
    const sampleAssets: EditorAsset[] = [
      {
        key: "asset:sample",
        assetID: "sample",
        assetURL: "https://example.com/sample.png",
        previewURL: null,
        fileName: "sample.png",
        kind: "画像",
        status: "success",
        file: null,
        errorMessage: "",
      },
    ];
    if (hasSecondImage) {
      sampleAssets.push({
        ...sampleAssets[0],
        key: "asset:second",
        assetID: "second",
        assetURL: "https://example.com/second.png",
        fileName: "second.png",
      });
    }
    store.getState().addAssets(sampleAssets);
    if (description) store.getState().setDescription(description);
    store.getState().setMarkdownMode(initialMode);
  }, [store, description, hasSecondImage, initialMode]);
  return (
    <>
      {isUploadVisible && <AssetUpload />}
      <MarkdownEditor />
    </>
  );
};

export const ImageInsertion: Story = {
  render: () => <ImageInsertionExample hasSecondImage />,
};

const LONG_DOCUMENT_DESCRIPTION = Array.from(
  { length: 500 },
  (_, index) =>
    `**行 ${index + 1}** ${"作品の内容と制作過程について説明する文章です。".repeat(3)}`,
).join("\n");

export const LongDocument: Story = {
  render: () => (
    <ImageInsertionExample description={LONG_DOCUMENT_DESCRIPTION} />
  ),
};

export const UndoImageInsertion: Story = {
  tags: ["test"],
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    await userEvent.click(await canvas.findByRole("button", { name: "挿入" }));
    await expect(input).toHaveValue(
      "前![sample](https://example.com/sample.png)後",
    );
    document.execCommand("undo");
    await expect(input).toHaveValue("前後");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.queryByAltText("sample")).not.toBeInTheDocument();
  },
};

export const ToolbarImageInsertion: Story = {
  tags: ["test"],
  render: () => <ImageInsertionExample hasSecondImage isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.type(input, "作品の説明");
    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? Promise.resolve(
            Response.json({ id: "new", url: "https://example.com/new.png" }),
          )
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "画像を選んで挿入" }),
      );
      await userEvent.upload(
        canvas.getByLabelText("説明に挿入する画像を選択"),
        new File(["image"], "new.png", { type: "image/png" }),
      );
      await waitFor(() =>
        expect(input).toHaveValue(
          "作品の説明![new](https://example.com/new.png)",
        ),
      );
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
      await expect(canvas.getByAltText("new")).toHaveAttribute(
        "src",
        "https://example.com/new.png",
      );
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const EditAndPreview: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.type(input, "# Storybook");
    for (const mode of ["分割", "ライブ", "プレビュー"]) {
      await userEvent.click(canvas.getByRole("tab", { name: mode }));
      await expect(
        await canvas.findByRole("heading", { name: "Storybook" }),
      ).toBeVisible();
    }
    await expect(input).toHaveValue("# Storybook");
  },
};

export const EmptyPreview: Story = {
  render: () => <ImageInsertionExample initialMode="preview" />,
};
