import type { Comment } from "../types/comment";

export const mockComments: Comment[] = [
  {
    id: "1",
    content: "進捗無いです。",
    created_at: "2025-11-23T10:30:00Z",
    reply_at: "",
    updated_at: "2025-11-23T10:30:00Z",
    user: {
      id: "user1",
      display_name: "けいたん",
      avatar_url:
        "https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/114/397/967/457/644/125/original/eca8bee7af356d9f.png",
    },
  },
  {
    id: "2",
    content: "はよ創れ",
    created_at: "2025-11-23T11:15:00Z",
    reply_at: "",
    updated_at: "2025-11-23T11:15:00Z",
    user: {
      id: "user2",
      display_name: "Semikoron",
      avatar_url:
        "https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/110/275/885/725/745/131/original/c9bc5b34647f2e0d.jpg",
    },
  },
  {
    id: "3",
    content: "進捗あります。",
    created_at: "2025-11-23T12:00:00Z",
    reply_at: "",
    updated_at: "2025-11-23T12:00:00Z",
    user: {
      id: "user2",
      display_name: "Semikoron",
      avatar_url:
        "https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/110/275/885/725/745/131/original/c9bc5b34647f2e0d.jpg",
    },
  },
  {
    id: "4",
    content: "進捗どうですか？",
    created_at: "2025-11-23T12:30:00Z",
    reply_at: "1",
    updated_at: "2025-11-23T12:30:00Z",
    user: {
      id: "user2",
      display_name: "Semikoron",
      avatar_url:
        "https://s3.ap-northeast-1.wasabisys.com/mastodondb/accounts/avatars/110/275/885/725/745/131/original/c9bc5b34647f2e0d.jpg",
    },
  },
];
