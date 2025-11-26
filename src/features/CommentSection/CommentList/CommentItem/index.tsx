import { useCallback } from "react";

import CommentInput from "../../CommentInput";
import styles from "./index.module.css";

import type React from "react";
import type { Comment } from "@/shared/types/comment";

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  replies?: Comment[];
  allComments?: Comment[];
  depth?: number;
  replyingTo?: Comment;
  onSubmitReply?: (message: string, parentId?: string) => void;
  onCancelReply?: () => void;
}

const Avatar: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  return (
    <div className={styles.avatar} role="img" aria-label={alt || "avatar"}>
      {src ? (
        <img src={src} alt={alt} className={styles["avatar-img"]} />
      ) : (
        <div className={styles["avatar-placeholder"]} />
      )}
    </div>
  );
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  onReply,
  replies = [],
  allComments = [],
  depth = 0,
  replyingTo,
  onSubmitReply,
  onCancelReply,
}) => {
  const handleDelete = useCallback(() => {
    if (window.confirm("このコメントを削除しますか?")) {
      onDelete?.(comment.id);
    }
  }, [comment.id, onDelete]);

  // 子コメント（返信）を取得し、新しい順にソート
  const getReplies = (parentId: string) => {
    return allComments
      .filter((c) => c.reply_at === parentId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles["comment-row"]}>
        <Avatar
          src={comment.user.avatar_url}
          alt={`${comment.user.display_name} avatar`}
        />
        <div className={styles["comment-body"]}>
          <div className={styles.header}>
            <div className={styles.username}>{comment.user.display_name}</div>
            {onDelete && (
              <button
                type="button"
                className={styles["delete-btn"]}
                onClick={handleDelete}
                aria-label="コメントを削除"
              >
                削除
              </button>
            )}
          </div>
          <div className={styles.bubble}>
            <p className={styles["bubble-text"]}>{comment.content}</p>
          </div>
          <button
            type="button"
            className={styles["reply-btn"]}
            onClick={() => onReply(comment)}
          >
            返信
          </button>
        </div>
      </div>
      {/* 返信対象のコメントの場合、入力欄を表示 */}
      {replyingTo?.id === comment.id && (
        <div className={styles["reply-input-wrapper"]}>
          <CommentInput
            onSubmit={(msg) => onSubmitReply?.(msg, comment.id)}
            onCancelReply={onCancelReply}
            replyingTo={comment}
            autoFocus
          />
        </div>
      )}
      {/* 子コメントがある場合、再帰的に表示 */}
      {replies.length > 0 && (
        // 深さ2未満の場合はインデントし、それ以降はフラットに表示（YouTube風）
        <div
          className={
            depth < 2
              ? styles["replies-container"]
              : styles["replies-container-flat"]
          }
        >
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onReply={onReply}
              replies={getReplies(reply.id)}
              allComments={allComments}
              depth={depth + 1}
              replyingTo={replyingTo}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
