import { useState } from "react";
import { mutate } from "swr";

import { useAuthStore } from "../auth/store/useAuthStore";
import postComment from "./api/postComment";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import useComment, { getCommentSWRKey } from "./hook/useComment";
import styles from "./index.module.css";

import Paper from "@/shared/ui/Paper";
import useToast from "@/shared/ui/Toast/hook/useToast";

import type { Comment } from "@/shared/types/comment";

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { data } = useComment({ workId: postId });
  const accessToken = useAuthStore((state) => state.accessToken);
  const { showToast } = useToast();

  const [replyingTo, setReplyingTo] = useState<Comment | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(undefined);
  };

  const handleSubmit = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || !accessToken || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await postComment(postId, trimmed, accessToken, replyingTo?.id);
      await mutate(getCommentSWRKey(postId));
      setReplyingTo(undefined);
    } catch {
      showToast({
        message: "コメントを送信できませんでした",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper width="read">
      <h2 className={styles["title"]}>
        コメント
        <span className={styles["comment-count"]}>{data.length}</span>
      </h2>
      <div className={styles["content"]}>
        {data.length === 0 ? (
          <p className={styles["empty"]}>まだコメントはありません。</p>
        ) : (
          <CommentList
            comments={data}
            onReply={handleReply}
            replyingTo={replyingTo}
            isReplyEnabled={!!accessToken}
            isSubmitting={isSubmitting}
            onSubmitReply={(message) => void handleSubmit(message)}
            onCancelReply={handleCancelReply}
          />
        )}
        {accessToken ? (
          <CommentInput
            onSubmit={(message) => void handleSubmit(message)}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            isSubmitting={isSubmitting}
          />
        ) : (
          <p className={styles["login-notice"]}>
            コメントするにはログインしてください。
          </p>
        )}
      </div>
    </Paper>
  );
};

export default CommentSection;
