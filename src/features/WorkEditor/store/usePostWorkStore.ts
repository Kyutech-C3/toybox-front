import { create } from "zustand";

type PostWorkStore = {
  title: string;
  description: string;
  tag_ids: string[];
  asset_ids: string[];
  thumbnail_asset_id: string;
  pending_upload_count: number;
  urls: string[];
  visibility: "public" | "private" | "draft";
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  addAssetID: (asset_id: string) => void;
  removeAssetID: (asset_id: string) => void;
  setThumbnailAssetID: (thumbnail_asset_id: string) => void;
  beginUpload: () => void;
  finishUpload: () => void;
  addTagID: (tag_id: string) => void;
  removeTagID: (tag_id: string) => void;
  setUrls: (urls: string[]) => void;
  addUrl: (url: string) => void;
  removeUrl: (index: number) => void;
  setVisibility: (visibility: "public" | "private" | "draft") => void;
  resetPostWork: () => void;
};

const INITIAL_POST_WORK_STATE = {
  title: "",
  description: "",
  tag_ids: [],
  asset_ids: [],
  thumbnail_asset_id: "",
  pending_upload_count: 0,
  urls: [],
  visibility: "draft",
} satisfies Pick<
  PostWorkStore,
  | "title"
  | "description"
  | "tag_ids"
  | "asset_ids"
  | "thumbnail_asset_id"
  | "pending_upload_count"
  | "urls"
  | "visibility"
>;

export const usePostWorkStore = create<PostWorkStore>((set) => ({
  ...INITIAL_POST_WORK_STATE,
  setTitle: (title: string) => {
    set({ title });
  },
  setDescription: (description: string) => {
    set({ description });
  },
  addAssetID: (asset_id: string) => {
    set((state) => ({
      asset_ids: [...state.asset_ids, asset_id],
    }));
  },
  removeAssetID: (asset_id: string) => {
    set((state) => ({
      asset_ids: state.asset_ids.filter((id) => id !== asset_id),
    }));
  },
  setThumbnailAssetID: (thumbnail_asset_id: string) => {
    set({ thumbnail_asset_id });
  },
  beginUpload: () => {
    set((state) => ({
      pending_upload_count: state.pending_upload_count + 1,
    }));
  },
  finishUpload: () => {
    set((state) => ({
      pending_upload_count: Math.max(0, state.pending_upload_count - 1),
    }));
  },
  addTagID: (tag_id: string) => {
    set((state) => ({
      tag_ids: [...state.tag_ids, tag_id],
    }));
  },
  removeTagID: (tag_id: string) => {
    set((state) => ({
      tag_ids: state.tag_ids.filter((id) => id !== tag_id),
    }));
  },
  setUrls: (urls: string[]) => {
    set({ urls });
  },
  addUrl: (url: string) => {
    set((state) => ({ urls: [...state.urls, url] }));
  },
  removeUrl: (index: number) => {
    set((state) => ({
      urls: state.urls.filter((_, i) => i !== index),
    }));
  },
  setVisibility: (visibility: "public" | "private" | "draft") => {
    set({ visibility });
  },
  resetPostWork: () => {
    set(INITIAL_POST_WORK_STATE);
  },
}));
