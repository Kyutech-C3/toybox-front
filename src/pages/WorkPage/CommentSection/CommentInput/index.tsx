import { useCallback, useRef, useState } from "react";

import styles from "./index.module.css";
import SendButton from "./SendButton";

import type React from "react";
import type { Comment } from "../../../../shared/types/comment";

interface CommentInputProps {
  onSubmit?: (message: string) => void;
  replyingTo?: Comment | null;
  onCancelReply?: () => void;
  autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  replyingTo,
  onCancelReply,
  autoFocus,
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを内容に合わせて自動調整
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!value.trim()) return;
    onSubmit?.(value);
    setValue("");
    setTimeout(() => adjustHeight(), 0);
  }, [onSubmit, value, adjustHeight]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={styles.inputRow}>
      <div className={styles.avatar}>
        <img
          src="https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/110/275/885/725/745/131/original/c9bc5b34647f2e0d.jpg"
          alt="あなた"
          className={styles.avatarImg}
        />
      </div>
      <div className={styles.rightCol}>
        <div className={styles.username}>あなた</div>
        {/* 返信対象がある場合は表示 */}
        {replyingTo && (
          <div className={styles.replyInfo}>
            <span>{replyingTo.user.display_name} への返信</span>
            <button
              type="button"
              onClick={onCancelReply}
              className={styles.cancelReplyBtn}
              aria-label="返信をキャンセル"
            >
              ×
            </button>
          </div>
        )}
        <label className={styles.inputBox}>
          <span className={styles.srOnly}>コメントを入力</span>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="コメントを追加"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            // biome-ignore lint/a11y/noAutofocus: 返信時にフォーカスを当てるため
            autoFocus={autoFocus}
          />
        </label>
        <div className={styles.sendWrap}>
          <SendButton onClick={handleSend} disabled={!value.trim()} />
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
