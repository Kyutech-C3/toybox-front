type Work = {
  assets: Asset[];
  tags: Tag[];
  id: string;
  title: string;
  description: string;
  description_html: string;
  user: User;
  thumbnail_url: string;
  visibility: WorkVisibility;
  thumbnail_asset_id: string;
  urls: string[];
  created_at: string;
  updated_at: string;
};

type WorkVisibility = "public" | "private" | "draft";

type User = {
  id: string;
  display_name: string;
  avatar_url: string;
};

type WorkRequestData = {
  asset_ids: string[];
  description: string;
  tag_ids: string[];
  title: string;
  thumbnail_asset_id: string;
  urls: string[];
  visibility: WorkVisibility;
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
  id: string;
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
  Asset,
  Tag,
  TagListResponse,
  TagResponse,
  Work,
  WorkListResponse,
  WorkRequestData,
  WorkVisibility,
};
