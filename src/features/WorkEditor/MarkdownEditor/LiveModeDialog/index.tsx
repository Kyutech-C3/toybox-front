import { useEffect, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VerticalSplitRoundedIcon from "@mui/icons-material/VerticalSplitRounded";

import EditorModeTabs, { getEditorTabID } from "../EditorModeTabs";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

import type { ReactNode, RefObject } from "react";
import type { EditorMode } from "../types";

type LiveModeDialogProps = {
  mode: EditorMode;
  panelID: string;
  source: ReactNode;
  preview: ReactNode;
  scrollSyncButton: ReactNode;
  sourceRef: RefObject<HTMLDivElement | null>;
  previewRef: RefObject<HTMLDivElement | null>;
  imagePicker: ReactNode;
  imageActions: ReactNode;
  onModeChange: (mode: EditorMode) => void;
  onClose: () => void;
};

const LiveModeDialog = ({
  mode,
  panelID,
  source,
  preview,
  scrollSyncButton,
  sourceRef,
  previewRef,
  imagePicker,
  imageActions,
  onModeChange,
  onClose,
}: LiveModeDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // タブで別のモードへ移るときは、close イベントで Edit Mode に戻さない
  const isSwitchingModeRef = useRef(false);
  const livePanelID = `${panelID}-live`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    // top layer に載せることで、フォーカストラップと Esc が標準の挙動で効く
    dialog.showModal();
    dialog.querySelector("textarea")?.focus();

    const { overflow, paddingRight } = document.body.style;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  // close() 経由で閉じると、開く前にフォーカスしていた要素へ標準で戻る
  const handleCloseClick = () => dialogRef.current?.close();

  const handleDialogClose = () => {
    if (isSwitchingModeRef.current) {
      isSwitchingModeRef.current = false;
      return;
    }
    onClose();
  };

  const handleModeChange = (nextMode: EditorMode) => {
    if (nextMode === mode) return;
    isSwitchingModeRef.current = true;
    dialogRef.current?.close();
    onModeChange(nextMode);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles["live-dialog"]}
      aria-label="ライブモードの全画面表示"
      onClose={handleDialogClose}
    >
      <div className={styles["live-dialog-inner"]}>
        <header className={styles["live-dialog-header"]}>
          <p className={styles["live-dialog-title"]}>
            <VerticalSplitRoundedIcon fontSize="small" />
            ライブモード
          </p>
          <div className={styles["live-dialog-controls"]}>
            <EditorModeTabs
              mode={mode}
              panelID={livePanelID}
              onChange={handleModeChange}
            />
            {imageActions}
          </div>
          <Button
            isIconOnly
            icon={<CloseRoundedIcon />}
            className={styles["live-dialog-close"]}
            aria-label="全画面表示を閉じる"
            onClick={handleCloseClick}
          />
        </header>
        {imagePicker && (
          <div className={styles["live-dialog-picker"]}>{imagePicker}</div>
        )}
        <div
          id={livePanelID}
          role="tabpanel"
          aria-labelledby={getEditorTabID(livePanelID, mode)}
          className={styles["live-dialog-body"]}
        >
          <div className={styles["live-source"]} ref={sourceRef}>
            {source}
          </div>
          <div className={styles["live-preview"]}>
            <div className={styles["live-preview-content"]} ref={previewRef}>
              {preview}
            </div>
            {scrollSyncButton}
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default LiveModeDialog;
