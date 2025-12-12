type Work = {
  assets: Asset[];
  tags: Tag[];
  id: string;
  title: string;
  description: string;
  description_html: string;
  user_id: string;
  visibility: string;
  created_at: string;
  updated_at: string;
};

type Tag = {
  id: string;
  name: string;
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

export type { Work, Tag, Asset, WorkListResponse };
