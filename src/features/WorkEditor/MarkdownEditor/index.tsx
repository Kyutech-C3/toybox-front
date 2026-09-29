import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import SyncDisabledRoundedIcon from "@mui/icons-material/SyncDisabledRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { divider, getCommands } from "@uiw/react-md-editor/commands";
import MDEditor from "@uiw/react-md-editor/nohighlight";
import rehypeSanitize from "rehype-sanitize";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import ValidationMessage from "../ValidationMessage";
import { validateWork } from "../validateWork";
import { IMAGE_ASSET_ACCEPT } from "../WorkDetailForm/hook/useAssetUpload";
import EditorModeTabs, { getEditorTabID } from "./EditorModeTabs";
import useLiveScrollSync from "./hook/useLiveScrollSync";
import useMarkdownImageInsertion from "./hook/useMarkdownImageInsertion";
import styles from "./index.module.css";
import liveStyles from "./liveMode.module.css";
import MarkdownImagePicker, {
  MarkdownImageActions,
} from "./MarkdownImagePicker";

import CharacterCount from "@/shared/ui/CharacterCount";
import inputStyles from "@/shared/ui/Input/index.module.css";

import "./editor-custom.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Button from "@/shared/ui/Button";
import Paper from "@/shared/ui/Paper";

import type { ICommand } from "@uiw/react-md-editor";
import type { CSSProperties } from "react";
import type { EditorMode } from "./types";

const EDITOR_PLACEHOLDER = "Markdown で作品の説明を書けます";
const PREVIEW_UPDATE_DELAY_MS = 500;
const DEFAULT_MARKDOWN_COMMANDS = getCommands();
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

const MarkdownEditor = () => {
  const current = useWorkEditorStore((state) => state.current);
  const hasAttemptedSubmit = useWorkEditorStore(
    (state) => state.hasAttemptedSubmit,
  );
  const descriptionError = hasAttemptedSubmit
    ? validateWork(current).description
    : undefined;
  const description = useWorkEditorStore((state) => state.current.description);
  const setDescription = useWorkEditorStore((state) => state.setDescription);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState(true);
  const [lineNumberTarget, setLineNumberTarget] = useState<HTMLElement | null>(
    null,
  );
  const panelID = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const { sourceRef, previewRef } = useLiveScrollSync({
    isEnabled: (mode === "live" || mode === "split") && isScrollSyncEnabled,
  });
  const {
    fileInputRef,
    images,
    selectedImage,
    setSelectedImageKey,
    imageInsertNotice,
    clearImageInsertNotice,
    handleTextSelection,
    handleInsertImage,
    handleImageFileChange,
    handleImagePaste,
    handleImageDragOver,
    handleImageDrop,
    handleCommandFilter,
  } = useMarkdownImageInsertion({ editorRef, sourceRef, previewRef });
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
        if (didInsert) clearImageInsertNotice();
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
        multiple
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
          onDragOver: handleImageDragOver,
          onDrop: handleImageDrop,
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
            {mode === "live" && (
              <Button
                isIconOnly
                size="small"
                variant="secondary"
                icon={<CloseRoundedIcon />}
                className={styles["live-close-button"]}
                aria-label="ライブモードを終了"
                title="ライブモードを終了"
                onClick={() => handleModeChange("edit")}
              />
            )}
          </div>
          {mode !== "preview" && markdownImagePicker}
          {mode !== "preview" && imageInsertNotice && (
            <p className={styles["image-insert-notice"]} role="status">
              {imageInsertNotice}
            </p>
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
