import CommentItem from "./CommentItem";
import styles from "./index.module.css";

import type { Comment } from "@/shared/types/comment";

interface CommentListProps {
  comments: Comment[];
  onDelete?: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  replyingTo?: Comment;
  isReplyEnabled?: boolean;
  isSubmitting?: boolean;
  onSubmitReply?: (message: string, parentId?: string) => Promise<boolean>;
  onCancelReply?: () => void;
}

const CommentList = ({
  comments,
  onDelete,
  onReply,
  replyingTo,
  isReplyEnabled = true,
  isSubmitting = false,
  onSubmitReply,
  onCancelReply,
}: CommentListProps) => {
  const rootComments = comments
    .filter((c) => !c.reply_at)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const getReplies = (parentId: string) => {
    return comments
      .filter((c) => c.reply_at === parentId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  };

  return (
    <div className={styles["list"]}>
      {rootComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onReply={onReply}
          replies={getReplies(comment.id)}
          allComments={comments}
          replyingTo={replyingTo}
          isReplyEnabled={isReplyEnabled}
          isSubmitting={isSubmitting}
          onSubmitReply={onSubmitReply}
          onCancelReply={onCancelReply}
        />
      ))}
    </div>
  );
};

export default CommentList;
