import { useCallback, useState } from "react";

import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import styles from "./index.module.css";

import { mockComments } from "@/shared/mocks/commentData";
import Paper from "@/shared/ui/Paper";

import type React from "react";
import type { Comment } from "@/shared/types/comment";

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId: _postId }: CommentSectionProps) => {
  // モックデータを使用
  const [comments, setComments] = useState<Comment[]>(mockComments);
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
  const handleSubmit = useCallback((message: string, parentId?: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // 新しいコメントを追加
    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      created_at: new Date().toISOString(),
      // 返信の場合は親コメントIDを設定、そうでなければ空文字
      reply_at: parentId || "",
      updated_at: new Date().toISOString(),
      user: {
        id: "current-user",
        display_name: "あなた",
        avatar_url:
          "https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/110/275/885/725/745/131/original/c9bc5b34647f2e0d.jpg",
      },
    };
    setComments((prev) => [newComment, ...prev]);
    // 送信後は返信モードを解除
    setReplyingTo(undefined);
  }, []);

  // コメント削除（モック）
  const handleDelete = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  return (
    <Paper>
      <h2 className={styles.title}>コメント</h2>
      <div className={styles.content}>
        <CommentList
          comments={comments}
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
