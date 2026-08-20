import { create } from "zustand";

type PostWorkStore = {
  title: string;
  description: string;
  tag_ids: string[];
  asset_ids: string[];
  thumbnail_asset_id: string;
  urls: string[];
  visibility: "public" | "private" | "draft";
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  addAssetID: (asset_id: string) => void;
  removeAssetID: (index: number) => void;
  addTagID: (tag_id: string) => void;
  removeTagID: (tag_id: string) => void;
  addurl: (url: string) => void;
  removeUrl: (index: number) => void;
  setVisibility: (visibility: "public" | "private" | "draft") => void;
};

export const usePostWorkStore = create<PostWorkStore>((set) => ({
  title: "",
  description: "",
  tag_ids: [],
  asset_ids: [],
  thumbnail_asset_id: "",
  urls: [],
  visibility: "draft",
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
  removeAssetID: (index: number) => {
    set((state) => ({
      asset_ids: state.asset_ids.filter((_, i) => i !== index),
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
  addurl: (url: string) => {
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
}));
