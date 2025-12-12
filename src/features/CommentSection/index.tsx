import { useCallback, useState } from "react";

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
  // モックデータを使用
  const { data } = useComment(postId);
  // 返信対象のコメントを管理するState
  const [replyingTo, setReplyingTo] = useState<Comment | undefined>(undefined);

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(undefined);
  }, []);

  // コメント送信（モック）
  // parentIdがある場合は返信として扱う
  const handleSubmit = useCallback(
    (message: string, parentId?: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        console.error("No access token available");
        return;
      }

      const res = postComment(postId, trimmed, accessToken, parentId);
      console.log("Posted comment:", res);
      // setComments((prev) => [newComment, ...prev]);
      // // 送信後は返信モードを解除
      setReplyingTo(undefined);
    },
    [postId],
  );

  // コメント削除（モック）
  const handleDelete = useCallback((commentId: string) => {
    console.log("Delete comment with ID:", commentId);
  }, []);

  return (
    <Paper>
      <h2 className={styles.title}>コメント</h2>
      <div className={styles.content}>
        <CommentList
          comments={data}
          onDelete={handleDelete}
          onReply={handleReply}
          replyingTo={replyingTo}
          onSubmitReply={handleSubmit}
          onCancelReply={handleCancelReply}
        />
        <CommentInput onSubmit={(msg) => handleSubmit(msg)} />
      </div>
    </Paper>
  );
};

export default CommentSection;
