//reply_at: string;は親コメントの投稿IDこれは返信のときに必要になる
export interface Comment {
  content: string;
  created_at: string;
  id: string;
  reply_at: string;
  updated_at: string;
  user: {
    avatar_url: string;
    display_name: string;
    id: string;
  };
}
