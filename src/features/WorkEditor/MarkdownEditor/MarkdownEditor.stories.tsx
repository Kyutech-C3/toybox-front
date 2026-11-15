import { useEffect } from "react";
import {
  expect,
  fireEvent,
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

type AssetInsertionExampleProps = {
  description?: string;
  isUploadVisible?: boolean;
  hasSecondImage?: boolean;
  hasMediaAssets?: boolean;
  initialMode?: EditorMode;
};

const AssetInsertionExample = ({
  description = "",
  isUploadVisible = false,
  hasSecondImage = false,
  hasMediaAssets = false,
  initialMode = "edit",
}: AssetInsertionExampleProps) => {
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
    if (hasMediaAssets) {
      sampleAssets.push(
        {
          ...sampleAssets[0],
          key: "asset:video",
          assetID: "video",
          assetURL: "https://example.com/movie.mp4?a=1&b=2",
          fileName: 'movie"&.mp4',
          kind: "動画",
        },
        {
          ...sampleAssets[0],
          key: "asset:audio",
          assetID: "audio",
          assetURL: "https://example.com/music.mp3",
          fileName: "music.mp3",
          kind: "音声",
        },
        {
          ...sampleAssets[0],
          key: "asset:zip",
          assetID: "zip",
          assetURL: "https://example.com/files.zip",
          fileName: "files.zip",
          kind: "ZIP",
        },
        {
          ...sampleAssets[0],
          key: "asset:pending",
          assetID: null,
          assetURL: null,
          fileName: "pending.mp4",
          kind: "動画",
          status: "uploading",
        },
      );
    }
    store.getState().addAssets(sampleAssets);
    if (description) store.getState().setDescription(description);
    store.getState().setMarkdownMode(initialMode);
  }, [store, description, hasSecondImage, hasMediaAssets, initialMode]);
  return (
    <>
      {isUploadVisible && <AssetUpload />}
      <MarkdownEditor />
    </>
  );
};

export const AssetInsertion: Story = {
  render: () => <AssetInsertionExample hasSecondImage hasMediaAssets />,
};

const LONG_DOCUMENT_DESCRIPTION = Array.from(
  { length: 500 },
  (_, index) =>
    `**行 ${index + 1}** ${"作品の内容と制作過程について説明する文章です。".repeat(3)}`,
).join("\n");

export const LongDocument: Story = {
  render: () => (
    <AssetInsertionExample description={LONG_DOCUMENT_DESCRIPTION} />
  ),
};

export const UndoImageInsertion: Story = {
  tags: ["test"],
  render: () => <AssetInsertionExample />,
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
  render: () => <AssetInsertionExample hasSecondImage isUploadVisible />,
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
        canvas.getByRole("button", { name: "画像・動画・音声を選んで挿入" }),
      );
      await userEvent.upload(
        canvas.getByLabelText("説明に挿入する画像・動画・音声を選択"),
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

export const MediaInsertion: Story = {
  tags: ["test"],
  render: () => <AssetInsertionExample hasMediaAssets isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const picker = within(
      await canvas.findByRole("region", {
        name: "説明に画像・動画・音声を入れる",
      }),
    );
    await expect(
      picker.queryByRole("button", { name: "files.zipを選択" }),
    ).toBeNull();
    await expect(
      picker.queryByRole("button", { name: "pending.mp4を選択" }),
    ).toBeNull();
    const input = canvas.getByRole("textbox", { name: "説明" });
    if (!(input instanceof HTMLTextAreaElement))
      throw new Error("説明欄がありません");
    await userEvent.type(input, "前後");
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    await userEvent.click(
      picker.getByRole("button", { name: 'movie"&.mp4を選択' }),
    );
    const copy = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const videoMarkup =
      '<video controls src="https://example.com/movie.mp4?a=1&amp;b=2" title="movie&quot;&amp;"></video>';
    try {
      await userEvent.click(
        picker.getByRole("button", { name: 'movie"&.mp4の Markdown をコピー' }),
      );
      await expect(copy).toHaveBeenCalledWith(videoMarkup);
    } finally {
      copy.mockRestore();
    }
    await userEvent.click(canvas.getByRole("button", { name: "挿入" }));
    await expect(input).toHaveValue(`前\n\n${videoMarkup}\n\n後`);
    document.execCommand("undo");
    await expect(input).toHaveValue("前後");
    await userEvent.click(canvas.getByText("挿入", { selector: "button" }));
    await userEvent.click(
      picker.getByRole("button", { name: "music.mp3を選択" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "挿入" }));
    await expect(input).toHaveValue(
      `前\n\n${videoMarkup}\n\n<audio controls src="https://example.com/music.mp3" title="music"></audio>\n\n後`,
    );
    await waitFor(() =>
      expect(canvas.getAllByText("説明文使用中")).toHaveLength(2),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
    const video = canvasElement.querySelector("video[controls]");
    const audio = canvasElement.querySelector("audio[controls]");
    await expect(video).toHaveAttribute(
      "src",
      "https://example.com/movie.mp4?a=1&b=2",
    );
    await expect(video).toHaveAttribute("title", 'movie"&');
    await expect(audio).toHaveAttribute("src", "https://example.com/music.mp3");
  },
};

export const ToolbarMediaUpload: Story = {
  tags: ["test"],
  render: () => <AssetInsertionExample isUploadVisible />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const originalAuth = useAuthStore.getState();
    const originalFetch = globalThis.fetch;
    const uploadedNames: string[] = [];
    globalThis.fetch = (resource, init) => {
      if (!String(resource).endsWith("/auth/works/asset"))
        return originalFetch(resource, init);
      const file =
        init?.body instanceof FormData ? init.body.get("file") : null;
      if (!(file instanceof File))
        throw new Error("アップロードファイルがありません");
      uploadedNames.push(file.name);
      return Promise.resolve(
        Response.json({
          id: file.name,
          url: `https://example.com/${file.name}`,
        }),
      );
    };
    useAuthStore.getState().startSession("storybook-token");
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "画像・動画・音声を選んで挿入" }),
      );
      await userEvent.upload(
        canvas.getByLabelText("説明に挿入する画像・動画・音声を選択"),
        [
          new File(["video"], "new.mp4", { type: "video/mp4" }),
          new File(["audio"], "new.mp3", { type: "audio/mpeg" }),
        ],
      );
      await waitFor(() =>
        expect(uploadedNames).toEqual(["new.mp4", "new.mp3"]),
      );
      const input = canvas.getByRole("textbox", { name: "説明" });
      await waitFor(() =>
        expect(input).toHaveValue(
          '<video controls src="https://example.com/new.mp4" title="new"></video>\n\n<audio controls src="https://example.com/new.mp3" title="new"></audio>',
        ),
      );
      await userEvent.click(canvas.getByRole("tab", { name: "プレビュー" }));
      await expect(
        canvasElement.querySelector("video[controls]"),
      ).toHaveAttribute("src", "https://example.com/new.mp4");
      await expect(
        canvasElement.querySelector("audio[controls]"),
      ).toHaveAttribute("src", "https://example.com/new.mp3");
    } finally {
      globalThis.fetch = originalFetch;
      useAuthStore.setState(originalAuth);
    }
  },
};

export const ReferencedMediaRemoval: Story = {
  tags: ["test"],
  render: () => (
    <AssetInsertionExample
      hasMediaAssets
      isUploadVisible
      description={
        '前の文章\n\n<video controls src="https://example.com/movie.mp4?a=1&amp;b=2"></video>\n\n<audio controls><source src="https://example.com/music.mp3"></audio>\n\n後の文章'
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getAllByText("説明文使用中")).toHaveLength(2),
    );
    const confirm = spyOn(window, "confirm").mockReturnValue(true);
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: 'movie"&.mp4を削除' }),
      );
      await expect(confirm).toHaveBeenCalled();
      const input = canvas.getByRole("textbox", { name: "説明" });
      if (!(input instanceof HTMLTextAreaElement))
        throw new Error("説明欄がありません");
      await expect(input.value).not.toContain("<video");
      await expect(input.value).toContain("後の文章");
      await expect(
        canvas.queryByRole("button", { name: 'movie"&.mp4を選択' }),
      ).toBeNull();
      await userEvent.click(
        canvas.getByRole("button", { name: "music.mp3を削除" }),
      );
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "説明文から参照を削除してから",
      );
      await expect(input.value).toContain(
        '<source src="https://example.com/music.mp3">',
      );
      await expect(
        canvas.getByRole("button", { name: "music.mp3を選択" }),
      ).toBeVisible();
    } finally {
      confirm.mockRestore();
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
  render: () => <AssetInsertionExample initialMode="preview" />,
};
