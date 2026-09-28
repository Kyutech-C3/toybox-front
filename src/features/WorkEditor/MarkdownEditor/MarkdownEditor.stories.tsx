import { useEffect } from "react";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";

import { useWorkEditorStoreApi } from "../store/useWorkEditorStore";
import WorkEditorStoreProvider from "../store/WorkEditorStoreProvider";
import AssetUpload from "../WorkDetailForm/AssetUpload";
import MarkdownEditor from "./index";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Meta, StoryObj } from "@storybook/react";
import type { EditorAsset } from "../types";

const META = {
  title: "Features/WorkEditor/MarkdownEditor",
  component: MarkdownEditor,
  decorators: [
    (Story) => (
      <WorkEditorStoreProvider>
        <div style={{ width: "min(900px, 95vw)" }}>
          <Story />
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
};

const ImageInsertionExample = ({
  description = "",
  isUploadVisible = false,
  hasSecondImage = false,
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
  }, [store, description, hasSecondImage]);
  return (
    <>
      {isUploadVisible && <AssetUpload />}
      <MarkdownEditor />
    </>
  );
};

export const ImageInsertion: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    const insertButton = await canvas.findByRole("button", {
      name: "カーソル位置に挿入",
    });
    await userEvent.click(insertButton);
    await expect(input).toHaveValue(
      "前![sample](https://example.com/sample.png)後",
    );
    await expect(insertButton).toHaveAccessibleName("画像を挿入しました");
    await expect(insertButton).toContainElement(
      within(insertButton).getByTestId("CheckRoundedIcon"),
    );
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    const writeText = fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "画像の Markdown をコピー" }),
      );
      await expect(writeText).toHaveBeenCalledWith(
        "![sample](https://example.com/sample.png)",
      );
      const copyButton = canvas.getByRole("button", { name: "コピーしました" });
      await expect(copyButton).toContainElement(
        within(copyButton).getByTestId("CheckRoundedIcon"),
      );
    } finally {
      if (clipboardDescriptor) {
        Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
      } else {
        Reflect.deleteProperty(navigator, "clipboard");
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2100));
    await expect(insertButton).toHaveAccessibleName("カーソル位置に挿入");
    await expect(insertButton).toContainElement(
      within(insertButton).getByTestId("AddPhotoAlternateRoundedIcon"),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.getByAltText("sample")).toHaveAttribute(
      "src",
      "https://example.com/sample.png",
    );
    await expect(
      canvas.queryByRole("region", { name: "説明に画像を入れる" }),
    ).not.toBeInTheDocument();
  },
};

export const UndoImageInsertion: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    await userEvent.click(
      await canvas.findByRole("button", { name: "カーソル位置に挿入" }),
    );
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
  render: () => <ImageInsertionExample hasSecondImage isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    const fileInput = canvas.getByLabelText("説明に挿入する画像を選択");
    if (!(fileInput instanceof HTMLInputElement))
      throw new Error("画像ファイルの入力欄が見つかりません");
    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    const uploadGate: { resolve?: (response: Response) => void } = {};
    const uploadRequest = fn(
      () =>
        new Promise<Response>((resolve) => {
          uploadGate.resolve = resolve;
        }),
    );
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? uploadRequest()
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      const pickerClick = fn();
      fileInput.addEventListener("click", pickerClick);
      await userEvent.click(
        canvas.getByRole("button", { name: "画像を選んで挿入" }),
      );
      await expect(pickerClick).toHaveBeenCalledTimes(1);
      await userEvent.upload(
        fileInput,
        new File(["image"], "new.png", { type: "image/png" }),
      );
      await expect(
        canvas.getByRole("button", { name: "new.pngを削除" }),
      ).toBeDisabled();
      input.setSelectionRange(input.value.length, input.value.length);
      fireEvent.select(input);
      if (!uploadGate.resolve)
        throw new Error("画像のアップロードが開始されませんでした");
      uploadGate.resolve(
        new Response(
          JSON.stringify({ id: "new", url: "https://example.com/new.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      await canvas.findByRole("button", { name: "new.pngを選択" });
      await expect(
        canvas.getByRole("button", { name: "new.pngを削除" }),
      ).toBeInTheDocument();
      await expect(uploadRequest).toHaveBeenCalledTimes(1);
      await expect(input).toHaveValue(
        "前![new](https://example.com/new.png)後",
      );
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
    document.execCommand("undo");
    await expect(input).toHaveValue("前後");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.queryByAltText("new")).not.toBeInTheDocument();
  },
};

export const ToolbarImageUploadFailure: Story = {
  render: () => <ImageInsertionExample isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    const fileInput = canvas.getByLabelText("説明に挿入する画像を選択");
    if (!(fileInput instanceof HTMLInputElement))
      throw new Error("画像ファイルの入力欄が見つかりません");
    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? Promise.resolve(new Response(null, { status: 500 }))
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "画像を選んで挿入" }),
      );
      await userEvent.upload(
        fileInput,
        new File(["image"], "failed.png", { type: "image/png" }),
      );
      await canvas.findByRole("button", {
        name: "failed.pngを再アップロード",
      });
      await expect(
        canvas.getByText("画像のアップロードに失敗しました"),
      ).toBeVisible();
      await expect(input).toHaveValue("");
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const LiveImageInsertion: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "sample.pngを選択" });
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const dialog = await canvas.findByRole("dialog", {
      name: "ライブモードの全画面表示",
    });
    const live = within(dialog);
    await expect(
      live.getByRole("tablist", { name: "Markdown の表示モード" }).parentElement
        ?.nextElementSibling,
    ).toContainElement(
      live.getByRole("region", { name: "説明に画像を入れる" }),
    );
    const input = live.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    await userEvent.click(
      live.getByRole("button", { name: "カーソル位置に挿入" }),
    );
    await expect(input).toHaveValue(
      "前![sample](https://example.com/sample.png)後",
    );
    const fileInput = live.getByLabelText("説明に挿入する画像を選択");
    if (!(fileInput instanceof HTMLInputElement))
      throw new Error("画像ファイルの入力欄が見つかりません");
    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? Promise.resolve(
            new Response(
              JSON.stringify({
                id: "live",
                url: "https://example.com/live.png",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          )
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      const pickerClick = fn();
      fileInput.addEventListener("click", pickerClick);
      await userEvent.click(
        live.getByRole("button", { name: "画像を選んで挿入" }),
      );
      await expect(pickerClick).toHaveBeenCalledTimes(1);
      await userEvent.upload(
        fileInput,
        new File(["image"], "live.png", { type: "image/png" }),
      );
      await live.findByRole("button", { name: "live.pngを選択" });
      await expect(input).toHaveValue(
        "前![sample](https://example.com/sample.png)![live](https://example.com/live.png)後",
      );
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
    await userEvent.click(live.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.getByAltText("sample")).toHaveAttribute(
      "src",
      "https://example.com/sample.png",
    );
    await expect(canvas.getByAltText("live")).toHaveAttribute(
      "src",
      "https://example.com/live.png",
    );
    await expect(
      canvas.queryByRole("region", { name: "説明に画像を入れる" }),
    ).not.toBeInTheDocument();
  },
};

const LONG_DESCRIPTION = Array.from(
  { length: 120 },
  (_, index) => `行${index + 1}`,
).join("\n\n");

export const ImageInsertionKeepsScroll: Story = {
  render: () => <ImageInsertionExample description={LONG_DESCRIPTION} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    const insertButton = await canvas.findByRole("button", {
      name: "カーソル位置に挿入",
    });
    await expect(document.documentElement.scrollHeight).toBeGreaterThan(
      window.innerHeight,
    );
    input.setSelectionRange(input.value.length, input.value.length);
    fireEvent.select(input);
    window.scrollTo(0, 0);
    await userEvent.click(insertButton);
    await expect(input).toHaveValue(
      `${LONG_DESCRIPTION}![sample](https://example.com/sample.png)`,
    );
    await expect(window.scrollY).toBe(0);
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const ReferencedImageCannotBeRemoved: Story = {
  render: () => (
    <ImageInsertionExample
      description="![sample](https://example.com/sample.png)"
      isUploadVisible
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "sample.pngを削除" }),
    );
    await expect(
      canvas.getByText(/説明欄から画像を外してから削除してください/),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "sample.pngを選択" }),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const EditAndPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(
      "Markdown で作品の説明を書けます",
    );
    await userEvent.type(input, "# Storybook");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByRole("heading", { name: "Storybook" }),
    ).toBeVisible();
  },
};

export const EmptyPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByText("プレビューする内容がありません"),
    ).toBeVisible();
  },
};

export const ExtendedPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText("Markdown の書き方", { selector: "summary" }),
    ).not.toBeInTheDocument();
    const input = canvas.getByRole("textbox", { name: "説明" });
    await fireEvent.change(input, {
      target: {
        value:
          "> [!NOTE]\n> プレビューの補足\n\n<details open><summary>プレビューの詳細</summary>\n\n**本文**\n\n</details>\n\n```ts:main.ts\nconst value = 1;\n```",
      },
    });
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.getByText("補足", { exact: true })).toBeVisible();
    await expect(
      canvas.getByText("プレビューの詳細", { selector: "summary" }),
    ).toBeVisible();
    await expect(canvas.getByText("main.ts")).toBeVisible();
  },
};
