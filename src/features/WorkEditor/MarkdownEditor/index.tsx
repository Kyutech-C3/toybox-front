import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import SyncDisabledRoundedIcon from "@mui/icons-material/SyncDisabledRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { divider, getCommands } from "@uiw/react-md-editor/commands";
import MDEditor from "@uiw/react-md-editor/nohighlight";
import rehypeSanitize from "rehype-sanitize";

import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../store/useWorkEditorStore";
import ValidationMessage from "../ValidationMessage";
import { validateWork } from "../validateWork";
import useAssetUpload, {
  IMAGE_ASSET_ACCEPT,
} from "../WorkDetailForm/hook/useAssetUpload";
import EditorModeTabs, { getEditorTabID } from "./EditorModeTabs";
import useLiveScrollSync from "./hook/useLiveScrollSync";
import styles from "./index.module.css";
import liveStyles from "./liveMode.module.css";
import MarkdownImagePicker, {
  getAssetImageMarkdown,
  MarkdownImageActions,
} from "./MarkdownImagePicker";

import CharacterCount from "@/shared/ui/CharacterCount";
import FieldError from "@/shared/ui/FieldError";
import inputStyles from "@/shared/ui/Input/index.module.css";

import "./editor-custom.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Button from "@/shared/ui/Button";
import Paper from "@/shared/ui/Paper";

import type { ICommand } from "@uiw/react-md-editor";
import type {
  ChangeEvent,
  ClipboardEvent,
  CSSProperties,
  SyntheticEvent,
} from "react";
import type { EditorAsset } from "../types";
import type { EditorMode } from "./types";

const EDITOR_PLACEHOLDER = "Markdown で作品の説明を書けます";
const PREVIEW_UPDATE_DELAY_MS = 500;
const DEFAULT_MARKDOWN_COMMANDS = getCommands();
const CLIPBOARD_IMAGE_EXTENSIONS: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/bmp": [".bmp"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};
type ImageInsertionSelection = {
  textarea: HTMLTextAreaElement;
  start: number;
  end: number;
  description: string;
  sessionVersion: number;
};

type DelayedMarkdownPreviewProps = {
  description: string;
};

const DelayedMarkdownPreview = ({
  description,
}: DelayedMarkdownPreviewProps) => {
  const [content, setContent] = useState(description);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setContent(description),
      PREVIEW_UPDATE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [description]);

  return useMemo(
    () =>
      content.trim() ? (
        <MarkdownPreview content={content} />
      ) : (
        <p className={styles["preview-empty"]}>
          プレビューする内容がありません
        </p>
      ),
    [content],
  );
};

const isInsertableImage = (asset: EditorAsset) => {
  if (asset.kind !== "画像" || asset.status !== "success" || !asset.assetURL)
    return false;
  try {
    const protocol = new URL(asset.assetURL).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const MarkdownEditor = () => {
  const current = useWorkEditorStore((state) => state.current);
  const hasAttemptedSubmit = useWorkEditorStore(
    (state) => state.hasAttemptedSubmit,
  );
  const descriptionError = hasAttemptedSubmit
    ? validateWork(current).description
    : undefined;
  const description = useWorkEditorStore((state) => state.current.description);
  const assets = useWorkEditorStore((state) => state.current.assets);
  const setDescription = useWorkEditorStore((state) => state.setDescription);
  const editorStore = useWorkEditorStoreApi();
  const { handleAddImageFile, validationError: imageUploadError } =
    useAssetUpload();
  const [mode, setMode] = useState<EditorMode>("edit");
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState(true);
  const [selectedImageKey, setSelectedImageKey] = useState("");
  const [imageInsertNotice, setImageInsertNotice] = useState("");
  const [lineNumberTarget, setLineNumberTarget] = useState<HTMLElement | null>(
    null,
  );
  const panelID = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSelectionRef = useRef<ImageInsertionSelection | null>(null);
  const pendingInsertionRef = useRef<{
    selectionStart: number;
    selectionEnd: number;
    pageX: number;
    pageY: number;
    sourceScrollTop: number | null;
    previewScrollTop: number | null;
    textareaScrollTop: number | null;
  } | null>(null);
  const { sourceRef, previewRef } = useLiveScrollSync({
    isEnabled: (mode === "live" || mode === "split") && isScrollSyncEnabled,
  });
  const images = assets.filter(isInsertableImage);
  const selectedImage =
    images.find((asset) => asset.key === selectedImageKey) ?? images[0];
  const markdownLines = description.split("\n");
  const lineNumberWidth = Math.max(
    56,
    String(markdownLines.length).length * 8 + 16,
  );

  useLayoutEffect(() => {
    if (mode !== "live") return;
    const { overflow: htmlOverflow } = document.documentElement.style;
    const { overflow: bodyOverflow } = document.body.style;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [mode]);

  useLayoutEffect(() => {
    if (mode === "preview") {
      setLineNumberTarget(null);
      return;
    }
    setLineNumberTarget(
      editorRef.current?.querySelector<HTMLElement>(".w-md-editor-text") ??
        null,
    );
  }, [mode]);

  useLayoutEffect(() => {
    const pending = pendingInsertionRef.current;
    if (!pending) return;
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    textarea.setSelectionRange(pending.selectionStart, pending.selectionEnd);
    textarea.focus({ preventScroll: true });
    if (pending.textareaScrollTop !== null) {
      textarea.scrollTop = pending.textareaScrollTop;
    }
    if (pending.sourceScrollTop !== null && sourceRef.current) {
      sourceRef.current.scrollTop = pending.sourceScrollTop;
    }
    if (pending.previewScrollTop !== null && previewRef.current) {
      previewRef.current.scrollTop = pending.previewScrollTop;
    }
    window.scrollTo(pending.pageX, pending.pageY);
    textareaRef.current = textarea;
    pendingInsertionRef.current = null;
  });

  const handleTextSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    textareaRef.current = event.currentTarget;
  };

  const handleInsertImage = (
    markdown: string,
    savedSelection?: ImageInsertionSelection,
  ) => {
    const hasActiveTextarea = textareaRef.current?.isConnected ?? false;
    const textarea = savedSelection?.textarea?.isConnected
      ? savedSelection.textarea
      : hasActiveTextarea
        ? textareaRef.current
        : editorRef.current?.querySelector<HTMLTextAreaElement>(
            ".w-md-editor-text-input",
          );
    if (!textarea) return false;
    const previousValue = textarea.value;
    const currentDescription = editorStore.getState().current.description;
    const selection = savedSelection
      ? { start: savedSelection.start, end: savedSelection.end }
      : hasActiveTextarea
        ? { start: textarea.selectionStart, end: textarea.selectionEnd }
        : { start: currentDescription.length, end: currentDescription.length };
    const start = Math.min(selection.start, currentDescription.length);
    const end = Math.min(selection.end, currentDescription.length);
    const nextCaretPosition = start + markdown.length;
    pendingInsertionRef.current = {
      selectionStart: nextCaretPosition,
      selectionEnd: nextCaretPosition,
      pageX: window.scrollX,
      pageY: window.scrollY,
      sourceScrollTop: sourceRef.current?.scrollTop ?? null,
      previewScrollTop: previewRef.current?.scrollTop ?? null,
      textareaScrollTop: textarea.scrollTop,
    };
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(start, end);
    let didInsert = false;
    try {
      didInsert = document.execCommand("insertText", false, markdown);
    } catch {
      // 入力コマンドを使えない環境でも挿入は続ける
    }
    if (!didInsert) textarea.setRangeText(markdown, start, end, "end");
    if (editorStore.getState().current.description !== textarea.value) {
      setDescription(textarea.value);
    }
    textareaRef.current = textarea;
    return textarea.value !== previousValue;
  };

  const insertImageRef = useRef(handleInsertImage);
  insertImageRef.current = handleInsertImage;
  const captureImageSelection = (textarea: HTMLTextAreaElement) => ({
    textarea,
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    description: editorStore.getState().current.description,
    sessionVersion: editorStore.getState().sessionVersion,
  });
  const handleOpenImagePicker = () => {
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    setImageInsertNotice("");
    uploadSelectionRef.current = captureImageSelection(textarea);
    fileInputRef.current?.click();
  };
  const openImagePickerRef = useRef(handleOpenImagePicker);
  openImagePickerRef.current = handleOpenImagePicker;
  const uploadAndInsertImage = async (
    file: File,
    selection: ImageInsertionSelection,
  ) => {
    const uploaded = await handleAddImageFile(file);
    if (!uploaded?.assetURL) return;
    if (selection.sessionVersion !== editorStore.getState().sessionVersion)
      return;
    setSelectedImageKey(uploaded.key);
    if (
      selection.description !== editorStore.getState().current.description ||
      !selection.textarea.isConnected
    ) {
      setImageInsertNotice(
        "画像をアップロードしました。説明文または編集画面が変わったため、自動挿入せず、挿入ボタンから追加できます。",
      );
      return;
    }
    insertImageRef.current(getAssetImageMarkdown(uploaded), selection);
  };
  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    const selection = uploadSelectionRef.current;
    uploadSelectionRef.current = null;
    if (file && selection) void uploadAndInsertImage(file, selection);
  };
  const handleImagePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboard = event.clipboardData;
    if (
      clipboard.getData("text/plain") ||
      Array.from(clipboard.items).some(
        (item) => item.kind === "string" && item.type === "text/plain",
      )
    )
      return;
    const image =
      Array.from(clipboard.items)
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile() ??
      Array.from(clipboard.files).find((file) =>
        file.type.startsWith("image/"),
      );
    if (!image) return;
    event.preventDefault();

    const extensions = CLIPBOARD_IMAGE_EXTENSIONS[image.type];
    if (!extensions) {
      setImageInsertNotice("この画像形式には対応していません。");
      return;
    }
    const extension = image.name
      .slice(image.name.lastIndexOf("."))
      .toLowerCase();
    const uploadFile = extensions.includes(extension)
      ? image
      : new File([image], `clipboard-${Date.now()}${extensions[0]}`, {
          type: image.type,
        });
    setImageInsertNotice("");
    void uploadAndInsertImage(
      uploadFile,
      captureImageSelection(event.currentTarget),
    );
  };
  const handleCommandFilter = (
    command: ICommand,
    isExtra: boolean,
  ): ICommand => {
    if (isExtra || command.name !== "image") return command;
    return {
      ...command,
      buttonProps: {
        ...command.buttonProps,
        "aria-label": "画像を選んで挿入",
        title: "画像を選んで挿入",
      },
      execute: () => openImagePickerRef.current(),
    };
  };

  const handleHistoryCommand = (
    textarea: HTMLTextAreaElement,
    direction: "undo" | "redo",
  ) => {
    textarea.focus({ preventScroll: true });
    document.execCommand(direction);
  };

  const markdownCommands: ICommand[] = [
    {
      name: "undo",
      keyCommand: "undo",
      icon: <UndoRoundedIcon aria-hidden="true" />,
      buttonProps: {
        "aria-label": "元に戻す",
        title: "元に戻す (Ctrl/Cmd+Z)",
      },
      execute: (_state, api) => handleHistoryCommand(api.textArea, "undo"),
    },
    {
      name: "redo",
      keyCommand: "redo",
      icon: <RedoRoundedIcon aria-hidden="true" />,
      buttonProps: {
        "aria-label": "やり直す",
        title: "やり直す (Ctrl/Cmd+Shift+Z / Ctrl+Y)",
      },
      execute: (_state, api) => handleHistoryCommand(api.textArea, "redo"),
    },
    divider,
    ...DEFAULT_MARKDOWN_COMMANDS,
  ];

  const handleModeChange = (nextMode: EditorMode) => {
    if (nextMode === mode) return;
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    setMode(nextMode);
  };

  const markdownImagePicker = selectedImage && (
    <MarkdownImagePicker
      images={images}
      selectedKey={selectedImage.key}
      onSelect={(asset) => setSelectedImageKey(asset.key)}
    />
  );
  const markdownImageActions = selectedImage && (
    <MarkdownImageActions
      key={selectedImage.key}
      selectedImage={selectedImage}
      onInsert={(markdown) => {
        const didInsert = handleInsertImage(markdown);
        if (didInsert) setImageInsertNotice("");
        return didInsert;
      }}
    />
  );

  const markdownInput = (
    <CharacterCount value={description}>
      <input
        ref={fileInputRef}
        type="file"
        accept={`${IMAGE_ASSET_ACCEPT},image/png,image/jpeg,image/bmp,image/gif,image/webp`}
        aria-label="説明に挿入する画像を選択"
        hidden
        onChange={handleImageFileChange}
      />
      <MDEditor
        className={inputStyles["input-surface"]}
        value={description}
        onChange={(value) => setDescription(value ?? "")}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        preview="edit"
        extraCommands={[]}
        commands={markdownCommands}
        commandsFilter={handleCommandFilter}
        visibleDragbar={false}
        height="auto"
        textareaProps={{
          placeholder: EDITOR_PLACEHOLDER,
          "aria-label": "説明",
          "aria-invalid": !!descriptionError,
          "aria-describedby": descriptionError
            ? "work-error-description"
            : undefined,
          onSelect: handleTextSelection,
          onFocus: handleTextSelection,
          onKeyUp: handleTextSelection,
          onClick: handleTextSelection,
          onPaste: handleImagePaste,
        }}
      />
    </CharacterCount>
  );

  const markdownPreview = description.trim() ? (
    <MarkdownPreview content={description} />
  ) : (
    <p className={styles["preview-empty"]}>プレビューする内容がありません</p>
  );
  const scrollSyncButton = (
    <Button
      isIconOnly
      size="small"
      variant="secondary"
      isActive={isScrollSyncEnabled}
      icon={
        isScrollSyncEnabled ? <SyncRoundedIcon /> : <SyncDisabledRoundedIcon />
      }
      className={liveStyles["scroll-sync-button"]}
      aria-label="スクロール同期"
      aria-pressed={isScrollSyncEnabled}
      title={
        isScrollSyncEnabled
          ? "スクロール同期を解除"
          : "スクロール同期を有効にする"
      }
      onClick={() => setIsScrollSyncEnabled((current) => !current)}
    />
  );

  return (
    <div className={styles["markdown-editor-container"]} data-mode={mode}>
      <Paper>
        <div
          ref={editorRef}
          className={styles["markdown-editor"]}
          data-markdown-editor="true"
          data-mode={mode}
          style={
            {
              "--line-number-gutter-width": `${lineNumberWidth}px`,
            } as CSSProperties
          }
        >
          {lineNumberTarget &&
            createPortal(
              <div
                className={styles["line-numbers"]}
                data-testid="markdown-line-numbers"
                aria-hidden="true"
              >
                {markdownLines.map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 行番号は行の位置を表し、行ごとの状態を持たない
                  <div className={styles["line-number-row"]} key={index}>
                    <span className={styles["line-number"]}>{index + 1}</span>
                    <span className={styles["line-measure"]}>
                      {line || "\u200b"}
                    </span>
                  </div>
                ))}
              </div>,
              lineNumberTarget,
            )}
          <div className={styles["markdown-editor-header"]}>
            <EditorModeTabs
              mode={mode}
              panelID={panelID}
              onChange={handleModeChange}
            />
            {mode !== "preview" && markdownImageActions}
          </div>
          {mode !== "preview" && markdownImagePicker}
          {mode !== "preview" && imageInsertNotice && (
            <p className={styles["image-insert-notice"]} role="status">
              {imageInsertNotice}
            </p>
          )}
          {mode !== "preview" && imageUploadError && (
            <FieldError role="alert">{imageUploadError}</FieldError>
          )}
          <div
            id={panelID}
            role="tabpanel"
            aria-labelledby={getEditorTabID(panelID, mode)}
            className={[
              styles["markdown-editor-panel"],
              mode === "split" || mode === "live"
                ? liveStyles["live-body"]
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            tabIndex={mode === "preview" ? 0 : -1}
          >
            <div
              className={[
                styles["edit-pane"],
                mode === "split" || mode === "live"
                  ? liveStyles["live-source"]
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              ref={sourceRef}
            >
              {markdownInput}
            </div>
            {mode === "preview" && (
              <div className={styles["preview-pane"]}>{markdownPreview}</div>
            )}
            {(mode === "split" || mode === "live") && (
              <div className={liveStyles["live-preview"]}>
                <div
                  className={liveStyles["live-preview-content"]}
                  ref={previewRef}
                >
                  <DelayedMarkdownPreview description={description} />
                </div>
                {scrollSyncButton}
              </div>
            )}
          </div>
          <ValidationMessage field="description" />
        </div>
      </Paper>
    </div>
  );
};

export default MarkdownEditor;
