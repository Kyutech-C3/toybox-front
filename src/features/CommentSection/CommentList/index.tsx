import CommentItem from "./CommentItem";
import styles from "./index.module.css";

import type { Comment } from "@/shared/types/comment";

interface CommentListProps {
  comments: Comment[];
  onDelete?: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  replyingTo?: Comment;
  onSubmitReply?: (message: string, parentId?: string) => void;
  onCancelReply?: () => void;
}

const CommentList = ({
  comments,
  onDelete,
  onReply,
  replyingTo,
  onSubmitReply,
  onCancelReply,
}: CommentListProps) => {
  // ルートコメント（返信でないコメント）のみを抽出し、新しい順にソート
  const rootComments = comments
    .filter((c) => !c.reply_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  // 指定された親コメントに対する返信を取得し、新しい順にソート
  const getReplies = (parentId: string) => {
    return comments
      .filter((c) => c.reply_at === parentId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  };

  return (
    <div className={styles.list}>
      {rootComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onReply={onReply}
          replies={getReplies(comment.id)}
          allComments={comments}
          replyingTo={replyingTo}
          onSubmitReply={onSubmitReply}
          onCancelReply={onCancelReply}
        />
      ))}
    </div>
  );
};

export default CommentList;
