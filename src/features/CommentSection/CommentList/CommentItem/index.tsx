import { useCallback } from "react";
import { Link } from "react-router-dom";

import CommentInput from "../../CommentInput";
import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import { formatDateTime } from "@/util/formatDateTime";

import type { Comment } from "@/shared/types/comment";

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  replies?: Comment[];
  allComments?: Comment[];
  depth?: number;
  replyingTo?: Comment;
  isReplyEnabled?: boolean;
  isSubmitting?: boolean;
  onSubmitReply?: (message: string, parentId?: string) => Promise<boolean>;
  onCancelReply?: () => void;
}

const ANONYMOUS_USER_NAME = "Anonymous";

const CommentItem = ({
  comment,
  onDelete,
  onReply,
  replies = [],
  allComments = [],
  depth = 0,
  replyingTo,
  isReplyEnabled = true,
  isSubmitting = false,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) => {
  const handleDelete = useCallback(() => {
    if (window.confirm("このコメントを削除しますか?")) {
      onDelete?.(comment.id);
    }
  }, [comment.id, onDelete]);

  const getReplies = (parentId: string) => {
    return allComments
      .filter((c) => c.reply_at === parentId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  };

  const displayName = comment.user
    ? comment.user.display_name
    : ANONYMOUS_USER_NAME;
  const isReplying = replyingTo?.id === comment.id;

  return (
    <div className={styles["wrapper"]}>
      <div className={styles["comment-row"]}>
        {comment.user ? (
          <Link
            to={`/user/${comment.user.id}`}
            className={styles["avatar-link"]}
            aria-label={`${displayName}のユーザーページを開く`}
          >
            <Avatar
              avatarURL={comment.user.avatar_url || undefined}
              alt={`${displayName}のアバター`}
            />
          </Link>
        ) : (
          <Avatar alt={`${ANONYMOUS_USER_NAME}のアバター`} />
        )}
        <div className={styles["comment-body"]}>
          <div className={styles["header"]}>
            {comment.user ? (
              <Link
                to={`/user/${comment.user.id}`}
                className={styles["username"]}
              >
                {displayName}
              </Link>
            ) : (
              <span className={styles["username"]}>{displayName}</span>
            )}
            <time className={styles["posted-at"]} dateTime={comment.created_at}>
              {formatDateTime(comment.created_at)}
            </time>
          </div>
          <div className={styles["bubble"]}>
            <p className={styles["bubble-text"]}>{comment.content}</p>
          </div>
          <div className={styles["actions"]}>
            {isReplyEnabled && (
              <button
                type="button"
                className={styles["action-button"]}
                onClick={() => onReply(comment)}
                aria-expanded={isReplying}
              >
                {isReplying ? "返信中" : "返信"}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={styles["action-button"]}
                onClick={handleDelete}
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
      {/* 返信対象のコメントの場合、入力欄を表示 */}
      {isReplying && (
        <div className={styles["reply-input-wrapper"]}>
          <CommentInput
            onSubmit={(message) =>
              onSubmitReply?.(message, comment.id) ?? Promise.resolve(false)
            }
            onCancelReply={onCancelReply}
            replyingTo={comment}
            isSubmitting={isSubmitting}
            isAutoFocus
          />
        </div>
      )}
      {/* 子コメントがある場合、再帰的に表示 */}
      {replies.length > 0 && (
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
              isReplyEnabled={isReplyEnabled}
              isSubmitting={isSubmitting}
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
