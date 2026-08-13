import { create } from "zustand";

type PostWorkStoreProps = {
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
  removeTagID: (index: number) => void;
  addurl: (url: string) => void;
  removeUrl: (index: number) => void;
  setVisibility: (visibility: "public" | "private" | "draft") => void;
};

export const usePostWorkStore = create<PostWorkStoreProps>((set) => ({
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
  removeTagID: (index: number) => {
    set((state) => ({
      tag_ids: state.tag_ids.filter((_, i) => i !== index),
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
