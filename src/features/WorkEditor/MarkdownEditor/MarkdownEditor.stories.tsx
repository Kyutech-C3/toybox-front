import { useEffect } from "react";
import {
  expect,
  fireEvent,
  fn,
  spyOn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

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
    const modeHeader = canvas.getByRole("tablist", {
      name: "Markdown の表示モード",
    }).parentElement;
    await expect(modeHeader).toContainElement(insertButton);
    await expect(modeHeader).toContainElement(
      canvas.getByRole("button", { name: "画像の Markdown をコピー" }),
    );
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

const LINE_NUMBER_DESCRIPTION = [
  "1 行目",
  "2 行目",
  "3 行目",
  "長い行 ".repeat(90),
  "5 行目",
].join("\n");

export const LineNumbers: Story = {
  render: () => <ImageInsertionExample description={LINE_NUMBER_DESCRIPTION} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const numbers = await canvas.findByTestId("markdown-line-numbers");
    const rows = [...numbers.children] as HTMLElement[];
    await expect(rows).toHaveLength(5);
    await expect(rows.map((row) => row.firstElementChild?.textContent)).toEqual(
      ["1", "2", "3", "4", "5"],
    );
    await expect(rows[3].getBoundingClientRect().height).toBeGreaterThan(24);
    await expect(rows[4].getBoundingClientRect().top).toBeCloseTo(
      rows[3].getBoundingClientRect().bottom,
      0,
    );
    const highlightedText = canvasElement.querySelector(
      ".w-md-editor-text-pre > code",
    );
    if (!highlightedText)
      throw new Error("Markdown の入力表示が見つかりません");
    const getTextRect = (text: string) => {
      const textWalker = document.createTreeWalker(
        highlightedText,
        NodeFilter.SHOW_TEXT,
      );
      for (
        let textNode = textWalker.nextNode();
        textNode;
        textNode = textWalker.nextNode()
      ) {
        const offset = textNode.textContent?.indexOf(text) ?? -1;
        if (offset < 0) continue;
        const range = document.createRange();
        range.setStart(textNode, offset);
        range.setEnd(textNode, offset + 1);
        return range.getBoundingClientRect();
      }
      throw new Error(`${text} の入力表示が見つかりません`);
    };
    await expect(
      Math.abs(
        getTextRect("5 行目").top -
          getTextRect("1 行目").top -
          (rows[4].getBoundingClientRect().top -
            rows[0].getBoundingClientRect().top),
      ),
    ).toBeLessThan(2);
    const firstNumber = rows[0].firstElementChild;
    if (!(firstNumber instanceof HTMLElement))
      throw new Error("1 行目の行番号が見つかりません");
    await expect(getComputedStyle(firstNumber).fontSize).toBe("12px");
    const numberRange = document.createRange();
    numberRange.selectNodeContents(firstNumber);
    const numberGap =
      getTextRect("1 行目").left - numberRange.getBoundingClientRect().right;
    await expect(numberGap).toBeGreaterThanOrEqual(14);
    await expect(numberGap).toBeLessThan(18);

    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await userEvent.type(input, "{Enter}6 行目");
    await expect(numbers.children).toHaveLength(6);
    await expect(numbers.lastElementChild?.firstElementChild).toHaveTextContent(
      "6",
    );

    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    await waitFor(() =>
      expect(canvas.getByTestId("markdown-line-numbers")).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    await waitFor(() =>
      expect(canvas.getByTestId("markdown-line-numbers")).toBeVisible(),
    );
    await userEvent.click(
      within(
        canvas.getByRole("dialog", { name: "ライブモードの全画面表示" }),
      ).getByRole("tab", {
        name: "プレビュー",
      }),
    );
  },
};

export const HistorySurvivesModeChanges: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const undoButton = canvas.getByRole("button", { name: "元に戻す" });
    const redoButton = canvas.getByRole("button", { name: "やり直す" });
    const toolbarButtons = undoButton
      .closest(".w-md-editor-toolbar")
      ?.querySelectorAll("button");
    await expect(toolbarButtons?.[0]).toBe(undoButton);
    await expect(toolbarButtons?.[1]).toBe(redoButton);
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    const input = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.type(input, "ABC");
    await expect(undoButton).toBeEnabled();
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await userEvent.click(canvas.getByRole("tab", { name: "エディタ" }));
    const restoredInput = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.click(canvas.getByRole("button", { name: "元に戻す" }));
    await expect(restoredInput).toHaveValue("");
    await expect(
      canvas.getByRole("button", { name: "やり直す" }),
    ).toBeEnabled();
    await userEvent.click(canvas.getByRole("button", { name: "やり直す" }));
    await expect(restoredInput).toHaveValue("ABC");

    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    const splitInput = canvas.getByRole("textbox", { name: "説明" });
    await userEvent.click(splitInput);
    await userEvent.keyboard("{Control>}z{/Control}");
    await expect(splitInput).toHaveValue("");
    await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    await expect(splitInput).toHaveValue("ABC");
    await userEvent.keyboard("{Control>}z{/Control}");
    await userEvent.type(splitInput, "B");
    await expect(
      canvas.getByRole("button", { name: "やり直す" }),
    ).toBeDisabled();
    await expect(splitInput).toHaveValue("B");
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const live = within(
      await canvas.findByRole("dialog", {
        name: "ライブモードの全画面表示",
      }),
    );
    const liveInput = live.getByRole("textbox", { name: "説明" });
    await userEvent.click(liveInput);
    await userEvent.keyboard("{Control>}z{/Control}");
    await expect(liveInput).toHaveValue("");
    await userEvent.click(live.getByRole("tab", { name: "エディタ" }));
    await expect(
      canvas.getByRole("button", { name: "やり直す" }),
    ).toBeEnabled();
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
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

export const ToolbarImageUploadAfterTextChange: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    const fileInput = canvas.getByLabelText("説明に挿入する画像を選択");
    if (
      !(input instanceof HTMLTextAreaElement) ||
      !(fileInput instanceof HTMLInputElement)
    )
      throw new Error("画像入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 2);
    fireEvent.select(input);

    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    const uploadGate: { resolve?: (response: Response) => void } = {};
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset")
        ? new Promise<Response>((resolve) => {
            uploadGate.resolve = resolve;
          })
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "画像を選んで挿入" }),
      );
      await userEvent.upload(
        fileInput,
        new File(["image"], "later.png", { type: "image/png" }),
      );
      await userEvent.type(input, "追加");
      const editedDescription = input.value;
      if (!uploadGate.resolve)
        throw new Error("画像のアップロードが開始されませんでした");
      uploadGate.resolve(
        new Response(
          JSON.stringify({ id: "later", url: "https://example.com/later.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      await canvas.findByRole("button", { name: "later.pngを選択" });
      await expect(input).toHaveValue(editedDescription);
      await expect(canvas.getByRole("status")).toHaveTextContent(
        "自動挿入せず",
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "カーソル位置に挿入" }),
      );
      await expect(input.value).toContain(
        "![later](https://example.com/later.png)",
      );
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const ClipboardImagePaste: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);

    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    const uploadRequest = fn((file: FormDataEntryValue | null) => {
      if (!(file instanceof File) || !file.name.endsWith(".png"))
        throw new Error("貼り付け画像のファイル名が正しくありません");
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "pasted",
            url: "https://example.com/pasted.png",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    globalThis.fetch = (resource, init) =>
      String(resource).endsWith("/auth/works/asset") &&
      init?.body instanceof FormData
        ? uploadRequest(init.body.get("file"))
        : originalFetch(resource, init);
    useAuthStore.getState().startSession("storybook-token");
    try {
      const clipboard = new DataTransfer();
      clipboard.items.add(new File(["image"], "", { type: "image/png" }));
      await userEvent.paste(clipboard);
      await canvas.findByRole("button", { name: /clipboard-.*\.pngを選択/ });
      await expect(uploadRequest).toHaveBeenCalledTimes(1);
      await expect(input.value).toMatch(
        /^前!\[clipboard-\d+\]\(https:\/\/example\.com\/pasted\.png\)後$/,
      );
      const insertedDescription = input.value;
      await userEvent.click(canvas.getByRole("button", { name: "元に戻す" }));
      await expect(input).toHaveValue("前後");
      await userEvent.click(canvas.getByRole("button", { name: "やり直す" }));
      await expect(input).toHaveValue(insertedDescription);
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const ClipboardTextAndImagePastesText: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    const originalFetch = globalThis.fetch;
    const uploadRequest = fn();
    globalThis.fetch = (resource, init) => {
      if (String(resource).endsWith("/auth/works/asset")) uploadRequest();
      return originalFetch(resource, init);
    };
    try {
      await userEvent.click(input);
      const clipboard = new DataTransfer();
      clipboard.items.add(
        new File(["image"], "photo.png", { type: "image/png" }),
      );
      clipboard.setData("text/plain", "貼り付けた文章");
      await userEvent.paste(clipboard);
      await expect(input).toHaveValue("貼り付けた文章");
      await expect(uploadRequest).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    } finally {
      globalThis.fetch = originalFetch;
    }
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
    const liveHeader = live
      .getByRole("tablist", {
        name: "Markdown の表示モード",
      })
      .closest("header");
    await expect(liveHeader).toContainElement(
      live.getByRole("button", { name: "カーソル位置に挿入" }),
    );
    await expect(liveHeader?.nextElementSibling).toContainElement(
      live.getByRole("region", { name: "説明に画像を入れる" }),
    );
    const emptyPreview = live.getByText("プレビューする内容がありません");
    if (!(emptyPreview.parentElement instanceof HTMLElement))
      throw new Error("ライブモードのプレビューが見つかりません");
    await expect(emptyPreview.parentElement.scrollWidth).toBeLessThanOrEqual(
      emptyPreview.parentElement.clientWidth,
    );
    const input = live.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    const source = input.closest(".w-md-editor")?.parentElement?.parentElement;
    const content = source?.lastElementChild;
    if (!(source instanceof HTMLElement) || !(content instanceof HTMLElement))
      throw new Error("ライブモードの編集ペインが見つかりません");
    await expect(
      source.getBoundingClientRect().bottom -
        content.getBoundingClientRect().bottom,
    ).toBeLessThan(16);
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

export const ReferencedImageRemovalUpdatesDescription: Story = {
  render: () => (
    <ImageInsertionExample
      description={
        '前\n\n![sample](https://example.com/sample.png)\n\n![別の説明](https://example.com/sample.png "タイトル")\n\n![参照][sample-ref]\n\n[sample-ref]: https://example.com/sample.png\n\n<img src="https://example.com/sample.png" alt="HTML 画像">\n\n[リンク](https://example.com/sample.png)\n\n後'
      }
      isUploadVisible
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButton = await canvas.findByRole("button", {
      name: "sample.pngを削除",
    });
    await expect(canvas.getByText(/説明文でも使用中/)).toBeVisible();
    const confirm = spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    try {
      await userEvent.click(removeButton);
      await expect(removeButton).toBeInTheDocument();
      await userEvent.click(removeButton);
      await expect(confirm).toHaveBeenCalledWith(
        "sample.png は下の説明文でも使用されています。削除すると説明文からも画像を削除します。",
      );
      await expect(
        canvas.queryByRole("button", { name: "sample.pngを削除" }),
      ).not.toBeInTheDocument();
      const input = canvas.getByRole("textbox", { name: "説明" });
      if (!(input instanceof HTMLTextAreaElement))
        throw new Error("説明の入力欄が見つかりません");
      await expect(input.value).not.toContain(
        "![sample](https://example.com/sample.png)",
      );
      await expect(input.value).not.toContain(
        "![別の説明](https://example.com/sample.png",
      );
      await expect(input.value).not.toContain("![参照][sample-ref]");
      await expect(input.value).not.toContain("<img src=");
      await expect(input.value).toContain(
        "[sample-ref]: https://example.com/sample.png",
      );
      await expect(input.value).toContain(
        "[リンク](https://example.com/sample.png)",
      );
      await expect(
        canvas.getByRole("button", { name: "元に戻す" }),
      ).toBeDisabled();
    } finally {
      confirm.mockRestore();
    }
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const ComplexHtmlImageBlocksAssetRemoval: Story = {
  render: () => (
    <ImageInsertionExample
      description={
        '<div><img src="https://example.com/sample.png" alt="画像"><span>説明</span></div>'
      }
      isUploadVisible
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButton = await canvas.findByRole("button", {
      name: "sample.pngを削除",
    });
    await userEvent.click(removeButton);
    await expect(removeButton).toBeInTheDocument();
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "説明文から画像を削除してから",
    );
    const input = canvas.getByRole("textbox", { name: "説明" });
    await expect(input).toHaveValue(
      '<div><img src="https://example.com/sample.png" alt="画像"><span>説明</span></div>',
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const SplitModeStaysOnPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    const panel = canvas.getByRole("tabpanel");
    const [source, preview] = Array.from(panel.children);
    const scrollSyncButton = canvas.getByRole("button", {
      name: "スクロール同期",
    });
    await expect(preview).toContainElement(scrollSyncButton);
    await expect(scrollSyncButton).toHaveAttribute("aria-pressed", "true");
    const previewBounds = preview.getBoundingClientRect();
    const buttonBounds = scrollSyncButton.getBoundingClientRect();
    await expect(buttonBounds.top).toBeGreaterThanOrEqual(previewBounds.top);
    await expect(buttonBounds.right).toBeLessThanOrEqual(previewBounds.right);
    await expect(preview.scrollWidth).toBeLessThanOrEqual(preview.clientWidth);
    const initialHeight = source.getBoundingClientRect().height;
    await expect(preview.getBoundingClientRect().height).toBe(initialHeight);
    await expect(initialHeight).toBeLessThan(window.innerHeight);
    const input = canvas.getByRole("textbox", { name: "説明" });
    await fireEvent.change(input, {
      target: {
        value: Array.from(
          { length: 3 },
          (_, index) => `# 分割表示 ${index + 1}\n\n本文です。`,
        ).join("\n\n"),
      },
    });
    await expect(
      canvas.getByRole("heading", { name: "分割表示 1" }),
    ).toBeVisible();
    await expect(panel.children).toHaveLength(2);
    await expect(source.getBoundingClientRect().height).toBeGreaterThan(
      initialHeight,
    );
    await expect(preview.getBoundingClientRect().height).toBe(
      source.getBoundingClientRect().height,
    );
    await fireEvent.change(input, {
      target: {
        value: Array.from(
          { length: 35 },
          (_, index) => `# 分割表示 ${index + 1}\n\n本文です。`,
        ).join("\n\n"),
      },
    });
    await expect(source.getBoundingClientRect().height).toBe(
      window.innerHeight,
    );
    await expect(preview.getBoundingClientRect().height).toBe(
      window.innerHeight,
    );
    await userEvent.click(scrollSyncButton);
    await expect(scrollSyncButton).toHaveAttribute("aria-pressed", "false");
    await expect(scrollSyncButton).toHaveAttribute(
      "title",
      "スクロール同期を有効にする",
    );
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const dialog = await canvas.findByRole("dialog", {
      name: "ライブモードの全画面表示",
    });
    const live = within(dialog);
    const liveScrollSyncButton = live.getByRole("button", {
      name: "スクロール同期",
    });
    await expect(liveScrollSyncButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(liveScrollSyncButton);
    await expect(liveScrollSyncButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvasElement.querySelector('[data-markdown-editor="true"]'),
    ).toHaveAttribute("data-mode", "live");
    await userEvent.click(live.getByRole("tab", { name: "プレビュー" }));
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
