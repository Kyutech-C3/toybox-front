import { useId, useLayoutEffect, useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
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
import LiveModeDialog from "./LiveModeDialog";
import liveStyles from "./LiveModeDialog/index.module.css";
import MarkdownImagePicker, {
  getAssetImageMarkdown,
} from "./MarkdownImagePicker";

import CharacterCount from "@/shared/ui/CharacterCount";
import FieldError from "@/shared/ui/FieldError";
import inputStyles from "@/shared/ui/Input/index.module.css";

import "./editor-custom.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Paper from "@/shared/ui/Paper";

import type { ICommand } from "@uiw/react-md-editor";
import type { ChangeEvent, SyntheticEvent } from "react";
import type { EditorAsset } from "../types";
import type { EditorMode } from "./types";

const EDITOR_PLACEHOLDER = "Markdown で作品の説明を書けます";
type ImageInsertionSelection = {
  textarea: HTMLTextAreaElement;
  start: number;
  end: number;
  sessionVersion: number;
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
  const [selectedImageKey, setSelectedImageKey] = useState("");
  const panelID = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSelectionRef = useRef<ImageInsertionSelection | null>(null);
  const pendingInsertionRef = useRef<{
    caret: number;
    pageX: number;
    pageY: number;
    sourceScrollTop: number | null;
    previewScrollTop: number | null;
    textareaScrollTop: number | null;
  } | null>(null);
  const { sourceRef, previewRef } = useLiveScrollSync({
    isEnabled: mode === "live" || mode === "split",
  });
  const images = assets.filter(isInsertableImage);
  const selectedImage =
    images.find((asset) => asset.key === selectedImageKey) ?? images[0];

  useLayoutEffect(() => {
    const pending = pendingInsertionRef.current;
    if (!pending) return;
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    textarea.setSelectionRange(pending.caret, pending.caret);
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
      caret: nextCaretPosition,
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
  const handleOpenImagePicker = () => {
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    uploadSelectionRef.current = {
      textarea,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      sessionVersion: editorStore.getState().sessionVersion,
    };
    fileInputRef.current?.click();
  };
  const openImagePickerRef = useRef(handleOpenImagePicker);
  openImagePickerRef.current = handleOpenImagePicker;
  const handleImageFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    const selection = uploadSelectionRef.current;
    uploadSelectionRef.current = null;
    if (!file || !selection) return;
    const uploaded = await handleAddImageFile(file);
    if (!uploaded?.assetURL) return;
    if (
      selection.sessionVersion !== editorStore.getState().sessionVersion ||
      !selection.textarea.isConnected
    )
      return;
    setSelectedImageKey(uploaded.key);
    insertImageRef.current(getAssetImageMarkdown(uploaded), selection);
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

  const markdownImagePicker = mode !== "preview" && selectedImage && (
    <MarkdownImagePicker
      images={images}
      selectedKey={selectedImage.key}
      onSelect={(asset) => setSelectedImageKey(asset.key)}
      onInsert={handleInsertImage}
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
        onChange={(event) => void handleImageFileChange(event)}
      />
      <MDEditor
        className={inputStyles["input-surface"]}
        value={description}
        onChange={(value) => setDescription(value || "")}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        preview="edit"
        extraCommands={[]}
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
        }}
      />
    </CharacterCount>
  );

  const handleLiveModeClose = () => setMode("edit");

  const markdownPreview = description.trim() ? (
    <MarkdownPreview content={description} />
  ) : (
    <p className={styles["preview-empty"]}>プレビューする内容がありません</p>
  );

  return (
    <Paper>
      <div
        ref={editorRef}
        className={styles["markdown-editor"]}
        data-markdown-editor="true"
        data-mode={mode}
      >
        <div className={styles["markdown-editor-header"]}>
          <EditorModeTabs mode={mode} panelID={panelID} onChange={setMode} />
        </div>
        {markdownImagePicker}
        {(mode === "edit" || mode === "split") && imageUploadError && (
          <FieldError role="alert">{imageUploadError}</FieldError>
        )}
        <div
          id={panelID}
          role="tabpanel"
          aria-labelledby={getEditorTabID(panelID, mode)}
          className={[
            styles["markdown-editor-panel"],
            mode === "split" ? liveStyles["live-dialog-body"] : "",
          ]
            .filter(Boolean)
            .join(" ")}
          tabIndex={mode === "preview" ? 0 : -1}
        >
          {mode === "edit" && (
            <div className={styles["edit-pane"]}>{markdownInput}</div>
          )}
          {mode === "preview" && (
            <div className={styles["preview-pane"]}>{markdownPreview}</div>
          )}
          {mode === "split" && (
            <>
              <div className={liveStyles["live-source"]} ref={sourceRef}>
                {markdownInput}
              </div>
              <div className={liveStyles["live-preview"]} ref={previewRef}>
                {markdownPreview}
              </div>
            </>
          )}
          {mode === "live" && (
            <p className={styles["live-placeholder"]}>
              ライブモードを全画面で表示しています
            </p>
          )}
        </div>
        <ValidationMessage field="description" />
        {mode === "live" && (
          <LiveModeDialog
            mode={mode}
            panelID={panelID}
            source={markdownInput}
            preview={markdownPreview}
            sourceRef={sourceRef}
            previewRef={previewRef}
            imagePicker={
              <>
                {markdownImagePicker}
                {imageUploadError && (
                  <FieldError role="alert">{imageUploadError}</FieldError>
                )}
              </>
            }
            onModeChange={setMode}
            onClose={handleLiveModeClose}
          />
        )}
      </div>
    </Paper>
  );
};

export default MarkdownEditor;
