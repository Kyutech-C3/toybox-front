import VerticalSplitRoundedIcon from "@mui/icons-material/VerticalSplitRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import styles from "./index.module.css";

import EditSquareIcon from "@/shared/ui/EditSquareIcon";

import type { ReactNode } from "react";
import type { EditorMode } from "../types";

type EditorModeTabsProps = {
  mode: EditorMode;
  panelID: string;
  onChange: (mode: EditorMode) => void;
};

type EditorModeItem = {
  mode: EditorMode;
  label: string;
  icon: ReactNode;
};

const EDITOR_MODE_ITEMS: EditorModeItem[] = [
  {
    mode: "edit",
    label: "エディタ",
    icon: (
      <span className={styles["mode-tab-icon"]}>
        <EditSquareIcon />
      </span>
    ),
  },
  {
    mode: "preview",
    label: "プレビュー",
    icon: <VisibilityRoundedIcon fontSize="small" />,
  },
  {
    mode: "live",
    label: "ライブ",
    icon: <VerticalSplitRoundedIcon fontSize="small" />,
  },
];

export const getEditorTabID = (panelID: string, mode: EditorMode) =>
  `${panelID}-tab-${mode}`;

const EditorModeTabs = ({ mode, panelID, onChange }: EditorModeTabsProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();

    const currentIndex = EDITOR_MODE_ITEMS.findIndex(
      (item) => item.mode === mode,
    );
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextItem =
      EDITOR_MODE_ITEMS[
        (currentIndex + offset + EDITOR_MODE_ITEMS.length) %
          EDITOR_MODE_ITEMS.length
      ];

    onChange(nextItem.mode);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-mode="${nextItem.mode}"]`)
      ?.focus();
  };

  return (
    <div
      className={styles["mode-tabs"]}
      role="tablist"
      aria-label="Markdown の表示モード"
      aria-orientation="horizontal"
      data-mode={mode}
      onKeyDown={handleKeyDown}
    >
      <span aria-hidden="true" className={styles["mode-tabs-thumb"]} />
      {EDITOR_MODE_ITEMS.map((item) => (
        <button
          key={item.mode}
          id={getEditorTabID(panelID, item.mode)}
          type="button"
          role="tab"
          className={styles["mode-tab"]}
          data-mode={item.mode}
          data-selected={item.mode === mode ? "true" : "false"}
          aria-selected={item.mode === mode}
          aria-controls={panelID}
          tabIndex={item.mode === mode ? 0 : -1}
          onClick={() => onChange(item.mode)}
        >
          {item.icon}
          <span className={styles["mode-tab-label"]}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default EditorModeTabs;
