import React from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

import styles from "./index.module.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Paper from "@/shared/ui/Paper";
import "./editor-custom.css";

const MarkdownEditor = () => {
  const [value, setValue] = React.useState("**Hello world!!!**");
  const [editMode, setEditMode] = React.useState<"edit" | "preview" | "live">(
    "edit",
  );
  return (
    <Paper>
      <div>
        <button onClick={() => setEditMode("edit")} type="button">
          Edit Mode
        </button>
        <button onClick={() => setEditMode("preview")} type="button">
          Preview Mode
        </button>
        <button onClick={() => setEditMode("live")} type="button">
          Live Mode
        </button>
      </div>
      {editMode === "edit" ? (
        <div data-color-mode="light">
          <MDEditor
            value={value}
            onChange={(val) => setValue(val || "")}
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }}
            preview="edit"
            extraCommands={[]}
            visibleDragbar={false}
          />
        </div>
      ) : editMode === "preview" ? (
        <MarkdownPreview content={value} />
      ) : (
        <div data-color-mode="light" className={styles["live-editor-wrapper"]}>
          <div className={styles["live-editor"]}>
            <MDEditor
              value={value}
              onChange={(val) => setValue(val || "")}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              height={"100%"}
              preview="edit" // 編集モードのみ
              extraCommands={[]} // 追加ツールバーも空に
              visibleDragbar={false} // 高さドラッグバーを消す（任意）
            />
          </div>
          <div className={styles["live-preview"]}>
            <MarkdownPreview content={value} />
          </div>
        </div>
      )}
    </Paper>
  );
};

export default MarkdownEditor;
