import { useEffect, useRef, useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

import styles from "./index.module.css";

const HELP_POPOVER_ID = "model-controls-help";

const ModelControlsHelp = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        buttonRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles["controls-help"]}>
      <button
        ref={buttonRef}
        className={styles["controls-help-button"]}
        type="button"
        aria-label="3Dモデルの操作方法を表示"
        aria-controls={isOpen ? HELP_POPOVER_ID : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <HelpOutlineRoundedIcon aria-hidden="true" fontSize="large" />
      </button>
      {isOpen && (
        <div
          ref={popoverRef}
          id={HELP_POPOVER_ID}
          className={styles["controls-help-popover"]}
          role="dialog"
          aria-label="3Dモデルの操作方法"
        >
          <p className={styles["controls-help-title"]}>操作方法</p>
          <dl className={styles["controls-help-list"]}>
            <div>
              <dt>回転</dt>
              <dd>左・中ボタンドラッグ／1本指ドラッグ</dd>
            </div>
            <div>
              <dt>移動</dt>
              <dd>右ボタンドラッグ／2本指ドラッグ</dd>
            </div>
            <div>
              <dt>拡大・縮小</dt>
              <dd>ホイール・ピンチ</dd>
            </div>
            <div>
              <dt>全体表示</dt>
              <dd>Home</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default ModelControlsHelp;
