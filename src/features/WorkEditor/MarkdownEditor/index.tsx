import React from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

import styles from "./index.module.css";

import MarkdownPreview from "@/features/MarkdownPreview";
import Paper from "@/shared/ui/Paper";
import "./editor-custom.css";

import { usePostWorkStore } from "../store/usePostWorkStore";

const MarkdownEditor = () => {
  const { description, setDescription } = usePostWorkStore();
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
            value={description}
            onChange={(val) => setDescription(val || "")}
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }}
            preview="edit"
            extraCommands={[]}
            visibleDragbar={false}
          />
        </div>
      ) : editMode === "preview" ? (
        <MarkdownPreview content={description} />
      ) : (
        <div data-color-mode="light" className={styles["live-editor-wrapper"]}>
          <div className={styles["live-editor"]}>
            <MDEditor
              value={description}
              onChange={(val) => setDescription(val || "")}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              height={"100%"}
              preview="edit"
              extraCommands={[]}
              visibleDragbar={false}
            />
          </div>
          <div className={styles["live-preview"]}>
            <MarkdownPreview content={description} />
          </div>
        </div>
      )}
    </Paper>
  );
};

export default MarkdownEditor;
