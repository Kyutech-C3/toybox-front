import type { Work } from "@/shared/types/work";

export const createWork = (overrides: Partial<Work> = {}): Work => ({
  id: "work-1",
  title: "サンプル作品",
  description: "作品の説明",
  description_html: "",
  user: { id: "owner", display_name: "作者", avatar_url: "" },
  assets: [],
  tags: [],
  thumbnail_url: "/comingSoonHo-Oh.webp",
  thumbnail_asset_id: "thumbnail",
  is_favorite: false,
  visibility: "public",
  urls: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});
