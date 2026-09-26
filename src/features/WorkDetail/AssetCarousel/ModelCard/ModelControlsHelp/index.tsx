import { useId, useRef, useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Popover from "@/shared/ui/Popover";

const ModelControlsHelp = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverID = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles["controls-help"]}>
      <Button
        variant="ghost"
        isIconOnly
        icon={<HelpOutlineRoundedIcon />}
        ref={buttonRef}
        className={styles["controls-help-button"]}
        aria-label="3Dモデルの操作方法を表示"
        aria-controls={isOpen ? popoverID : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      />
      <Popover
        id={popoverID}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        className={styles["controls-help-popover"]}
        role="dialog"
        ariaLabel="3Dモデルの操作方法"
        placement="top"
        align="start"
        isAutoFocusEnabled
      >
        <p className={styles["controls-help-title"]}>操作方法</p>
        <dl className={styles["controls-help-list"]}>
          <div>
            <dt>回転</dt>
            <dd>左・中ボタンドラッグ／1本指ドラッグ／矢印キー</dd>
          </div>
          <div>
            <dt>移動</dt>
            <dd>右ボタンドラッグ／2本指ドラッグ／W・A・S・D</dd>
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
      </Popover>
    </div>
  );
};

export default ModelControlsHelp;
