import { create } from "zustand";

import { createTag } from "../api/createTag";
import { uploadAsset } from "../api/uploadAsset";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

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
  addAsset: (file: File) => void;
  removeAsset: (index: number) => void;
  addTag: (tag: string) => void;
  addNewTag: (tagName: string) => void;
  removeTag: (index: number) => void;
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
  addAsset: async (File) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const response = await uploadAsset(File, accessToken);
    set((state) => ({
      asset_ids: [...state.asset_ids, response.id],
    }));
  },
  removeAsset: (index: number) => {
    set((state) => ({
      asset_ids: state.asset_ids.filter((_, i) => i !== index),
    }));
  },
  addTag: (tag: string) => {
    set((state) => ({
      tag_ids: [...state.tag_ids, tag],
    }));
  },
  addNewTag: async (tagName: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const newTag = await createTag(tagName, accessToken);
    set((state) => ({
      tag_ids: [...state.tag_ids, newTag.id],
    }));
  },
  removeTag: (index: number) => {
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
