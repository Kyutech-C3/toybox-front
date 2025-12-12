type Work = {
  assets: Asset[];
  tags: Tag[];
  id: string;
  title: string;
  description: string;
  description_html: string;
  user: User;
  thumbnail_url: string;
  visibility: string;
  created_at: string;
  updated_at: string;
};

type User = {
  id: string;
  display_name: string;
  avatar_url: string;
};

type WorkRequestData = {
  assets: string[];
  discription: string;
  tag_ids: string[];
  title: string;
  thumbnail_asset_id: "string";
  urls: string[];
  visibility: "public" | "private" | "draft";
};

type Tag = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type TagResponse = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type TagListResponse = {
  tags: Tag[];
};

type Asset = {
  asset_type: string;
  created_at: Date;
  extension: string;
  updated_at: string;
  url: string;
  user_id: string;
  work_id: string;
};

type WorkListResponse = {
  works: Work[];
  total_count: number;
  page: number;
  limit: number;
};

export type {
  Work,
  WorkListResponse,
  WorkRequestData,
  Tag,
  TagResponse,
  TagListResponse,
  Asset,
};
