import { useId, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import EditorModeTabs, { getEditorTabID } from "./EditorModeTabs";
import useLiveScrollSync from "./hook/useLiveScrollSync";
import styles from "./index.module.css";
import LiveModeDialog from "./LiveModeDialog";

import "./editor-custom.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Paper from "@/shared/ui/Paper";

import type { EditorMode } from "./types";

const EDITOR_PLACEHOLDER = "Markdown で作品の説明を書けます";

const MarkdownEditor = () => {
  const description = useWorkEditorStore((state) => state.current.description);
  const setDescription = useWorkEditorStore((state) => state.setDescription);
  const [mode, setMode] = useState<EditorMode>("edit");
  const panelID = useId();
  const { sourceRef, previewRef } = useLiveScrollSync({
    isEnabled: mode === "live",
  });

  const markdownInput = (
    <MDEditor
      value={description}
      onChange={(value) => setDescription(value || "")}
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
      preview="edit"
      extraCommands={[]}
      visibleDragbar={false}
      height="auto"
      textareaProps={{ placeholder: EDITOR_PLACEHOLDER }}
    />
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
        className={styles["markdown-editor"]}
        data-markdown-editor="true"
        data-mode={mode}
        data-color-mode="light"
      >
        <div className={styles["markdown-editor-header"]}>
          <EditorModeTabs mode={mode} panelID={panelID} onChange={setMode} />
        </div>
        <div
          id={panelID}
          role="tabpanel"
          aria-labelledby={getEditorTabID(panelID, mode)}
          className={styles["markdown-editor-panel"]}
          tabIndex={mode === "preview" ? 0 : -1}
        >
          {mode === "edit" && (
            <div className={styles["edit-pane"]}>{markdownInput}</div>
          )}
          {mode === "preview" && (
            <div className={styles["preview-pane"]}>{markdownPreview}</div>
          )}
          {mode === "live" && (
            <p className={styles["live-placeholder"]}>
              ライブモードを全画面で表示しています
            </p>
          )}
        </div>
        {mode === "live" && (
          <LiveModeDialog
            mode={mode}
            panelID={panelID}
            source={markdownInput}
            preview={markdownPreview}
            sourceRef={sourceRef}
            previewRef={previewRef}
            onModeChange={setMode}
            onClose={handleLiveModeClose}
          />
        )}
      </div>
    </Paper>
  );
};

export default MarkdownEditor;
