import { useState } from "react";

import { useAuthStore } from "../auth/store/useAuthStore";
import postComment from "./api/postComment";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import useComment from "./hook/useComment";
import styles from "./index.module.css";

import Paper from "@/shared/ui/Paper";

import type { Comment } from "@/shared/types/comment";

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { data } = useComment(postId);

  // 返信対象のコメントを管理するState
  const [replyingTo, setReplyingTo] = useState<Comment | undefined>(undefined);

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(undefined);
  };

  // コメント送信（モック）
  // parentIdがある場合は返信として扱う
  const handleSubmit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      postComment(postId, trimmed, "", replyingTo?.id);
      return;
    }

    postComment(postId, trimmed, accessToken, replyingTo?.id);
    // 送信後は返信モードを解除
    setReplyingTo(undefined);
  };

  return (
    <Paper>
      <h2 className={styles["title"]}>コメント</h2>
      <div className={styles["content"]}>
        <CommentList
          comments={data}
          onReply={handleReply}
          replyingTo={replyingTo}
          onSubmitReply={handleSubmit}
          onCancelReply={handleCancelReply}
        />
        <CommentInput onSubmit={handleSubmit} replyingTo={replyingTo} />
      </div>
    </Paper>
  );
};

export default CommentSection;
