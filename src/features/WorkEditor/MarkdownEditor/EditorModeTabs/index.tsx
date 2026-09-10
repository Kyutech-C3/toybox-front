import VerticalSplitRoundedIcon from "@mui/icons-material/VerticalSplitRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import styles from "./index.module.css";

import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import SegmentedControl from "@/shared/ui/SegmentedControl";

import type { SegmentedControlOption } from "@/shared/ui/SegmentedControl";
import type { EditorMode } from "../types";

type EditorModeTabsProps = {
  mode: EditorMode;
  panelID: string;
  onChange: (mode: EditorMode) => void;
};

const EDITOR_MODE_OPTIONS: SegmentedControlOption<EditorMode>[] = [
  {
    value: "edit",
    label: "エディタ",
    icon: (
      <span className={styles["mode-tab-icon"]}>
        <EditSquareIcon />
      </span>
    ),
  },
  {
    value: "preview",
    label: "プレビュー",
    icon: <VisibilityRoundedIcon fontSize="small" />,
  },
  {
    value: "live",
    label: "ライブ",
    icon: <VerticalSplitRoundedIcon fontSize="small" />,
  },
];

export const getEditorTabID = (panelID: string, mode: EditorMode) =>
  `${panelID}-tab-${mode}`;

const EditorModeTabs = ({ mode, panelID, onChange }: EditorModeTabsProps) => {
  return (
    <SegmentedControl
      options={EDITOR_MODE_OPTIONS}
      value={mode}
      onChange={onChange}
      ariaLabel="Markdown の表示モード"
      role="tablist"
      getOptionID={(value) => getEditorTabID(panelID, value)}
      controlsID={panelID}
    />
  );
};

export default EditorModeTabs;
