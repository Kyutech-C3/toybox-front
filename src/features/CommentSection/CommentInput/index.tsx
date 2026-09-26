import { useCallback, useEffect, useRef, useState } from "react";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import styles from "./index.module.css";

import { useUserStore } from "@/features/auth/store/useUserStore";
import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";
import Textarea from "@/shared/ui/Textarea";

import type React from "react";
import type { Comment } from "@/shared/types/comment";

interface CommentInputProps {
  onSubmit: (message: string) => Promise<boolean>;
  replyingTo?: Comment;
  onCancelReply?: () => void;
  isAutoFocus?: boolean;
  isSubmitting?: boolean;
}

const CommentInput = ({
  onSubmit,
  replyingTo,
  onCancelReply,
  isAutoFocus,
  isSubmitting = false,
}: CommentInputProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (isAutoFocus) {
      textareaRef.current?.focus();
    }
  }, [isAutoFocus]);

  const handleSend = useCallback(async () => {
    if (!value.trim() || isSubmitting) return;
    const isSubmitted = await onSubmit(value);
    if (!isSubmitted) return;

    setValue("");
  }, [onSubmit, value, isSubmitting]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={styles["input-row"]}>
      <Avatar
        avatarURL={user?.icon_url || undefined}
        alt={`${user?.display_name ?? "あなた"}のアバター`}
      />
      <div className={styles["right-col"]}>
        {/* 返信対象がある場合は表示 */}
        {replyingTo && (
          <div className={styles["reply-info"]}>
            <span>
              {replyingTo.user ? replyingTo.user.display_name : "Anonymous"}{" "}
              への返信
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              className={styles["cancel-reply-button"]}
              aria-label="返信をキャンセル"
            >
              ×
            </button>
          </div>
        )}
        <Textarea
          isAutoResizing
          aria-label="コメントを入力"
          isCharacterCountVisible
          ref={textareaRef}
          className={styles["textarea"]}
          placeholder="コメントを追加"
          value={value}
          disabled={isSubmitting}
          maxLength={255}
          onChange={setValue}
          onKeyDown={handleKeyDown}
        />
        <div className={styles["send-wrap"]}>
          <p className={styles["send-hint"]}>Ctrl + Enter で送信</p>
          <div className={styles["send-button-slot"]}>
            <Button
              variant="accent"
              onClick={() => void handleSend()}
              isDisabled={!value.trim() || isSubmitting}
            >
              <span className={styles["send-icon"]} aria-hidden="true">
                <SendRoundedIcon fontSize="inherit" />
              </span>
              {isSubmitting ? "送信中..." : "送信"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
