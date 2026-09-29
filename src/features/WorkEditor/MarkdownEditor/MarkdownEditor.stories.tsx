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
  additionalImages?: number;
};

const ImageInsertionExample = ({
  description = "",
  isUploadVisible = false,
  hasSecondImage = false,
  additionalImages = 0,
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
    for (let index = 0; index < additionalImages; index += 1) {
      sampleAssets.push({
        ...sampleAssets[0],
        key: `asset:extra-${index}`,
        assetID: `extra-${index}`,
        assetURL: `https://example.com/extra-${index}.png`,
        fileName: `extra-${index}.png`,
      });
    }
    store.getState().addAssets(sampleAssets);
    if (description) store.getState().setDescription(description);
  }, [store, description, hasSecondImage, additionalImages]);
  return (
    <>
      {isUploadVisible && <AssetUpload />}
      <MarkdownEditor />
    </>
  );
};

export const ImageInsertion: Story = {
  render: () => <ImageInsertionExample hasSecondImage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    const insertButton = await canvas.findByRole("button", {
      name: "挿入",
    });
    const modeHeader = canvas.getByRole("tablist", {
      name: "Markdown の表示モード",
    }).parentElement;
    await expect(modeHeader).toContainElement(insertButton);
    const sampleButton = canvas.getByRole("button", {
      name: "sample.pngを選択",
    });
    const secondCopyButton = canvas.getByRole("button", {
      name: "second.pngの Markdown をコピー",
    });
    await expect(modeHeader).not.toContainElement(secondCopyButton);
    const secondButton = canvas.getByRole("button", {
      name: "second.pngを選択",
    });
    const imageBounds = secondButton.getBoundingClientRect();
    const copyBounds = secondCopyButton.getBoundingClientRect();
    await expect(imageBounds.width).toBeGreaterThanOrEqual(64);
    await expect(copyBounds.top).toBeGreaterThanOrEqual(imageBounds.top);
    await expect(copyBounds.right).toBeLessThanOrEqual(imageBounds.right);
    await expect(copyBounds.left).toBeGreaterThan(
      imageBounds.left + imageBounds.width / 2,
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
      await userEvent.click(secondCopyButton);
      await expect(writeText).toHaveBeenCalledWith(
        "![second](https://example.com/second.png)",
      );
      await expect(sampleButton).toHaveAttribute("aria-pressed", "true");
      await expect(secondButton).toHaveAttribute("aria-pressed", "false");
      const copyButton = canvas.getByRole("button", {
        name: "second.pngをコピーしました",
      });
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
    await expect(insertButton).toHaveAccessibleName("挿入");
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
    await expect(
      canvasElement.querySelector(".w-md-editor-text-pre"),
    ).not.toBeInTheDocument();
    const firstNumber = rows[0].firstElementChild;
    if (!(firstNumber instanceof HTMLElement))
      throw new Error("1 行目の行番号が見つかりません");
    await expect(getComputedStyle(firstNumber).fontSize).toBe("12px");
    const numberRange = document.createRange();
    numberRange.selectNodeContents(firstNumber);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    const numberGap =
      input.getBoundingClientRect().left +
      Number.parseFloat(getComputedStyle(input).paddingLeft) -
      numberRange.getBoundingClientRect().right;
    await expect(numberGap).toBeGreaterThanOrEqual(14);
    await expect(numberGap).toBeLessThan(18);
    await expect(input.scrollHeight).toBeLessThanOrEqual(
      input.clientHeight + 1,
    );
    input.style.height = "48px";
    input.scrollTop = 100;
    await expect(input.scrollTop).toBe(0);
    input.style.removeProperty("height");
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
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    const numbers = await canvas.findByTestId("markdown-line-numbers");
    await expect(numbers.children).toHaveLength(500);
    await expect(
      canvasElement.querySelector(".w-md-editor-text-pre"),
    ).not.toBeInTheDocument();
    await userEvent.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    const startedAt = performance.now();
    await userEvent.type(input, "追記");
    await expect(performance.now() - startedAt).toBeLessThan(500);
    await expect(input).toHaveValue(`${LONG_DOCUMENT_DESCRIPTION}追記`);
    await expect(input.scrollHeight).toBeLessThanOrEqual(
      input.clientHeight + 1,
    );
    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    const splitInput = canvas.getByRole("textbox", { name: "説明" });
    if (!(splitInput instanceof HTMLTextAreaElement))
      throw new Error("分割モードの入力欄が見つかりません");
    await userEvent.click(splitInput);
    splitInput.setSelectionRange(
      splitInput.value.length,
      splitInput.value.length,
    );
    const splitStartedAt = performance.now();
    await userEvent.type(splitInput, "追記");
    await expect(performance.now() - splitStartedAt).toBeLessThan(500);
    await expect(splitInput).toHaveValue(
      `${LONG_DOCUMENT_DESCRIPTION}追記追記`,
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

const ASSET_DOCUMENT_DESCRIPTION = `${LONG_DOCUMENT_DESCRIPTION}\n\n![sample](https://example.com/sample.png "タイトル")\n\n![参照][extra]\n\n[extra]: https://example.com/extra-0.png\n\n<img src="https://example.com/extra-1.png">\n\n[リンク](https://example.com/extra-2.png)`;

export const LongDocumentWithAssets: Story = {
  render: () => (
    <ImageInsertionExample
      description={ASSET_DOCUMENT_DESCRIPTION}
      isUploadVisible
      additionalImages={9}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    await waitFor(() =>
      expect(canvas.getAllByText("説明文でも使用中")).toHaveLength(3),
    );
    await userEvent.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    const startedAt = performance.now();
    await userEvent.type(input, "追記");
    await expect(performance.now() - startedAt).toBeLessThan(500);
    await expect(canvas.getAllByText("説明文でも使用中")).toHaveLength(3);
    fireEvent.change(input, { target: { value: LONG_DOCUMENT_DESCRIPTION } });
    await waitFor(() =>
      expect(canvas.queryAllByText("説明文でも使用中")).toHaveLength(0),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const NativeHistorySurvivesModeChanges: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    input.focus();
    document.execCommand("insertText", false, "ABC");
    await expect(input).toHaveValue("ABC");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(input.isConnected).toBe(true);
    await userEvent.click(canvas.getByRole("tab", { name: "エディタ" }));
    const restoredInput = canvas.getByRole("textbox", { name: "説明" });
    await expect(restoredInput).toBe(input);
    const undoButton = canvas.getByRole("button", { name: "元に戻す" });
    const redoButton = canvas.getByRole("button", { name: "やり直す" });
    await userEvent.click(undoButton);
    await expect(restoredInput).toHaveValue("");
    await userEvent.click(redoButton);
    await expect(restoredInput).toHaveValue("ABC");

    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    const splitInput = canvas.getByRole("textbox", { name: "説明" });
    if (!(splitInput instanceof HTMLTextAreaElement))
      throw new Error("分割モードの入力欄が見つかりません");
    await expect(splitInput).toBe(input);
    splitInput.focus();
    splitInput.setSelectionRange(
      splitInput.value.length,
      splitInput.value.length,
    );
    document.execCommand("insertText", false, "D");
    await expect(splitInput).toHaveValue("ABCD");
    document.execCommand("undo");
    await expect(splitInput).toHaveValue("ABC");
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const liveInput = canvas.getByRole("textbox", { name: "説明" });
    if (!(liveInput instanceof HTMLTextAreaElement))
      throw new Error("ライブモードの入力欄が見つかりません");
    await expect(liveInput).toBe(input);
    liveInput.focus();
    liveInput.setSelectionRange(liveInput.value.length, liveInput.value.length);
    document.execCommand("insertText", false, "E");
    await expect(liveInput).toHaveValue("ABCE");
    document.execCommand("undo");
    await expect(liveInput).toHaveValue("ABC");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const ModeChangeClearsHeadingHash: Story = {
  render: () => <ImageInsertionExample description="# 見出し" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalURL = window.location.href;
    const originalState = window.history.state;
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
      await userEvent.click(
        canvas.getByRole("link", { name: "「見出し」へのリンクをコピー" }),
      );
      await expect(decodeURIComponent(window.location.hash)).toBe("#見出し");
      await userEvent.click(canvas.getByRole("tab", { name: "エディタ" }));
      await expect(window.location.hash).toBe("");

      await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
      await userEvent.click(
        await canvas.findByRole("link", {
          name: "「見出し」へのリンクをコピー",
        }),
      );
      await expect(decodeURIComponent(window.location.hash)).toBe("#見出し");
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
      await expect(window.location.hash).toBe("");
      await expect(copy).toHaveBeenCalledTimes(2);
    } finally {
      copy.mockRestore();
      window.history.replaceState(originalState, "", originalURL);
    }
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
  render: () => <ImageInsertionExample hasSecondImage isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明の入力欄が見つかりません");
    input.focus();
    document.execCommand("insertText", false, "前後");
    await expect(input).toHaveValue("前後");
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
      await expect(input).toHaveValue("前後");
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
      input.focus();
      document.execCommand("undo");
      await expect(input).toHaveValue("前後");
      document.execCommand("undo");
      await expect(input).toHaveValue("");
      document.execCommand("redo");
      await expect(input).toHaveValue("前後");
      document.execCommand("redo");
      await expect(input).toHaveValue(
        "前![new](https://example.com/new.png)後",
      );
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(canvas.getByAltText("new")).toBeInTheDocument();
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
      await expect(input).toHaveValue("前後");
      await expect(canvas.getByRole("textbox", { name: "説明" })).toBe(input);
      await userEvent.type(input, "追加");
      if (!uploadGate.resolve)
        throw new Error("画像のアップロードが開始されませんでした");
      uploadGate.resolve(
        new Response(
          JSON.stringify({ id: "later", url: "https://example.com/later.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      await canvas.findByRole("button", { name: "later.pngを選択" });
      await expect(input.value).toContain(
        "![later](https://example.com/later.png)",
      );
      await expect(input.value).toContain("追加");
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
    const uploadRequest = fn(async (file: FormDataEntryValue | null) => {
      if (!(file instanceof File) || !file.name.endsWith(".png"))
        throw new Error("貼り付け画像のファイル名が正しくありません");
      await expect(file.text()).resolves.toBe("image");
      return new Response(
        JSON.stringify({
          id: "pasted",
          url: "https://example.com/pasted.png",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
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
        /^前!\[clipboard-\d+-1\]\(https:\/\/example\.com\/pasted\.png\)後$/,
      );
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
        canvas.getByText("アップロードに失敗しました"),
      ).toBeVisible();
      await expect(input).toHaveValue("");
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const MultipleImagePicker: Story = {
  render: () => <ImageInsertionExample isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "説明" });
    const originalFetch = globalThis.fetch;
    const originalAuth = useAuthStore.getState();
    globalThis.fetch = (resource, init) => {
      if (
        !String(resource).endsWith("/auth/works/asset") ||
        !(init?.body instanceof FormData)
      )
        return originalFetch(resource, init);
      const file = init.body.get("file");
      if (!(file instanceof File)) throw new Error("画像が見つかりません");
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: file.name,
            url: `https://example.com/${file.name}`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    };
    useAuthStore.getState().startSession("storybook-token");
    try {
      await userEvent.click(input);
      await userEvent.click(
        canvas.getByRole("button", { name: "画像を選んで挿入" }),
      );
      const fileInput = canvas.getByLabelText("説明に挿入する画像を選択");
      if (!(fileInput instanceof HTMLInputElement))
        throw new Error("画像ファイルの入力欄が見つかりません");
      await expect(fileInput).toHaveAttribute("multiple");
      await userEvent.upload(fileInput, [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ]);
      await canvas.findByRole("button", { name: "b.pngを選択" });
      await waitFor(() =>
        expect(input).toHaveValue(
          "![a](https://example.com/a.png)\n![b](https://example.com/b.png)",
        ),
      );
      await expect(
        canvas.getByRole("button", { name: "a.pngを削除" }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("button", { name: "b.pngを削除" }),
      ).toBeInTheDocument();
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const MultipleImageDrop: Story = {
  render: () => <ImageInsertionExample isUploadVisible />,
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
    const uploadGates = new Map<string, (response: Response) => void>();
    globalThis.fetch = (resource, init) => {
      if (
        !String(resource).endsWith("/auth/works/asset") ||
        !(init?.body instanceof FormData)
      )
        return originalFetch(resource, init);
      const file = init.body.get("file");
      if (!(file instanceof File)) throw new Error("画像が見つかりません");
      return new Promise<Response>((resolve) => {
        uploadGates.set(file.name, resolve);
      });
    };
    useAuthStore.getState().startSession("storybook-token");
    try {
      const textTransfer = new DataTransfer();
      textTransfer.setData("text/plain", "通常のテキスト");
      await expect(fireEvent.drop(input, { dataTransfer: textTransfer })).toBe(
        true,
      );

      const dataTransfer = new DataTransfer();
      for (const name of ["first.png", "failed.png", "last.png"])
        dataTransfer.items.add(new File([name], name, { type: "image/png" }));
      dataTransfer.items.add(
        new File(["video"], "movie.mp4", { type: "video/mp4" }),
      );
      await expect(dataTransfer.files).toHaveLength(4);
      const drop = new DragEvent("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(drop, "dataTransfer", { value: dataTransfer });
      await expect(input.dispatchEvent(drop)).toBe(false);
      await expect(input).toHaveValue("前後");
      await waitFor(() => expect(uploadGates.size).toBe(3));
      await expect(canvas.queryByText("movie.mp4")).not.toBeInTheDocument();

      uploadGates.get("last.png")?.(
        new Response(
          JSON.stringify({ id: "last", url: "https://example.com/last.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      uploadGates.get("failed.png")?.(new Response(null, { status: 500 }));
      uploadGates.get("first.png")?.(
        new Response(
          JSON.stringify({ id: "first", url: "https://example.com/first.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      await waitFor(() =>
        expect(input).toHaveValue(
          "前![first](https://example.com/first.png)\n![last](https://example.com/last.png)後",
        ),
      );
      await expect(
        canvas.getByRole("button", { name: "failed.pngを再アップロード" }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByText("アップロードに失敗しました"),
      ).toBeVisible();
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const LiveImageInsertion: Story = {
  render: () => <ImageInsertionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "sample.pngを選択" });
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const live = canvas;
    const liveHeader = live.getByRole("tablist", {
      name: "Markdown の表示モード",
    }).parentElement;
    await expect(liveHeader).toContainElement(
      live.getByRole("button", { name: "挿入" }),
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
    await userEvent.click(live.getByRole("button", { name: "挿入" }));
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
      name: "挿入",
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
    await expect(await canvas.findByText(/説明文でも使用中/)).toBeVisible();
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
      input.focus();
      document.execCommand("undo");
      await expect(input.value).not.toContain(
        "![sample](https://example.com/sample.png)",
      );
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
      await canvas.findByRole("heading", { name: "分割表示 1" }),
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
    const maximumHeight = Math.min(window.innerHeight * 0.7, 640);
    await expect(source.getBoundingClientRect().height).toBeCloseTo(
      maximumHeight,
      0,
    );
    await expect(preview.getBoundingClientRect().height).toBe(
      source.getBoundingClientRect().height,
    );
    await userEvent.click(scrollSyncButton);
    await expect(scrollSyncButton).toHaveAttribute("aria-pressed", "false");
    await expect(scrollSyncButton).toHaveAttribute(
      "title",
      "スクロール同期を有効にする",
    );
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const liveScrollSyncButton = canvas.getByRole("button", {
      name: "スクロール同期",
    });
    await expect(liveScrollSyncButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(liveScrollSyncButton);
    await expect(liveScrollSyncButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvasElement.querySelector('[data-markdown-editor="true"]'),
    ).toHaveAttribute("data-mode", "live");
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const LiveModeFitsViewport: Story = {
  render: () => (
    <ImageInsertionExample description={LONG_DESCRIPTION} hasSecondImage />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));

    const editor = canvasElement.querySelector<HTMLElement>(
      '[data-markdown-editor="true"]',
    );
    const paper = editor?.parentElement;
    const panel = canvas.getByRole("tabpanel");
    const [source, preview] = Array.from(panel.children);
    if (
      !(paper instanceof HTMLElement) ||
      !(source instanceof HTMLElement) ||
      !(preview instanceof HTMLElement)
    )
      throw new Error("ライブモードのペインが見つかりません");

    await expect(document.documentElement.style.overflow).toBe("hidden");
    await expect(document.body.style.overflow).toBe("hidden");
    const liveMargin = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--space-16"),
    );
    await expect(paper.getBoundingClientRect().top).toBe(liveMargin);
    await expect(paper.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
    await expect(source.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      paper.getBoundingClientRect().bottom,
    );
    await expect(preview.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      paper.getBoundingClientRect().bottom,
    );
    await expect(source.scrollHeight).toBeGreaterThan(source.clientHeight);
    source.scrollTop = source.scrollHeight;
    await expect(source.scrollTop).toBeGreaterThan(0);

    const closeButton = canvas.getByRole("button", {
      name: "ライブモードを終了",
    });
    await expect(
      closeButton.getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(paper.getBoundingClientRect().top);
    await expect(closeButton.getBoundingClientRect().top).toBeLessThanOrEqual(
      paper.getBoundingClientRect().top + 64,
    );
    await expect(
      closeButton.getBoundingClientRect().right,
    ).toBeGreaterThanOrEqual(paper.getBoundingClientRect().right - 64);
    await expect(closeButton.getBoundingClientRect().right).toBeLessThanOrEqual(
      paper.getBoundingClientRect().right,
    );
    await userEvent.click(closeButton);
    await expect(editor).toHaveAttribute("data-mode", "edit");
    await expect(closeButton).not.toBeInTheDocument();
    await expect(document.documentElement.style.overflow).toBe(
      originalHtmlOverflow,
    );
    await expect(document.body.style.overflow).toBe(originalBodyOverflow);
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
  },
};

export const PreviewUpdatesAfterPause: Story = {
  render: () => <ImageInsertionExample description="開始" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const longWord = "a".repeat(1200);
    await userEvent.click(canvas.getByRole("tab", { name: "分割" }));
    const input = canvas.getByRole("textbox", { name: "説明" });
    const preview = canvas.getByRole("tabpanel").children[1];
    if (
      !(input instanceof HTMLTextAreaElement) ||
      !(preview instanceof HTMLElement)
    )
      throw new Error("分割モードのペインが見つかりません");

    fireEvent.change(input, { target: { value: `分割${longWord}` } });
    await expect(preview).toHaveTextContent("開始");
    await expect(preview).not.toHaveTextContent(longWord);
    await waitFor(() => expect(preview).toHaveTextContent(`分割${longWord}`));
    await expect(preview.scrollWidth).toBeLessThanOrEqual(preview.clientWidth);

    await userEvent.click(canvas.getByRole("tab", { name: "ライブ" }));
    const liveInput = canvas.getByRole("textbox", { name: "説明" });
    const livePreview =
      canvas.getByRole("tabpanel").children[1]?.firstElementChild;
    if (
      !(liveInput instanceof HTMLTextAreaElement) ||
      !(livePreview instanceof HTMLElement)
    )
      throw new Error("ライブモードのペインが見つかりません");
    await expect(livePreview).toHaveTextContent(`分割${longWord}`);
    fireEvent.change(liveInput, { target: { value: `ライブ${longWord}` } });
    await expect(livePreview).toHaveTextContent(`分割${longWord}`);
    await waitFor(() =>
      expect(livePreview).toHaveTextContent(`ライブ${longWord}`),
    );
    await expect(livePreview.scrollWidth).toBeLessThanOrEqual(
      livePreview.clientWidth,
    );
    fireEvent.change(liveInput, { target: { value: "最新の本文" } });
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    await expect(
      canvas.getByText("最新の本文", { selector: "p" }),
    ).toBeVisible();
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
