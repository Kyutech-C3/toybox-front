import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

import { useUserStore } from "@/features/auth/store/useUserStore";
import Avatar from "@/shared/ui/Avatar";

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

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!value.trim() || isSubmitting) return;
    const isSubmitted = await onSubmit(value);
    if (!isSubmitted) return;

    setValue("");
    setTimeout(() => adjustHeight(), 0);
  }, [onSubmit, value, isSubmitting, adjustHeight]);

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
        <label className={styles["input-box"]}>
          <span className={styles["sr-only"]}>コメントを入力</span>
          <textarea
            ref={textareaRef}
            className={styles["textarea"]}
            placeholder="コメントを追加"
            value={value}
            disabled={isSubmitting}
            onChange={(event) => {
              setValue(event.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
          />
        </label>
        <div className={styles["send-wrap"]}>
          <p className={styles["send-hint"]}>Ctrl + Enter で送信</p>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!value.trim() || isSubmitting}
            className={styles["send-button"]}
          >
            {isSubmitting ? "送信中..." : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
