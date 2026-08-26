import { createStore } from "zustand";

import { MAX_WORK_URL_COUNT } from "../constants";
import {
  cloneWorkEditorValues,
  EMPTY_WORK_EDITOR_VALUES,
  revokePreviewURL,
  revokeValuesPreviewURLs,
  toWorkEditorValues,
} from "../editorAsset";

import type { Work, WorkVisibility } from "@/shared/types/work";
import type {
  EditorAsset,
  EditorTag,
  WorkEditorMode,
  WorkEditorValues,
} from "../types";

export type WorkEditorStore = {
  mode: WorkEditorMode;
  workID: string | null;
  ownerID: string | null;
  initializedKey: string | null;
  current: WorkEditorValues;
  baseline: WorkEditorValues;

  initializeForNew: () => void;
  initializeForEdit: (work: Work) => void;
  markSaved: () => void;
  resetEditor: () => void;

  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setVisibility: (visibility: WorkVisibility) => void;
  addTag: (tag: EditorTag) => void;
  removeTag: (tagID: string) => void;
  setUrls: (urls: string[]) => void;
  addAssets: (assets: EditorAsset[]) => void;
  updateAsset: (key: string, update: Partial<EditorAsset>) => void;
  removeAsset: (key: string) => void;
  setThumbnail: (thumbnail: EditorAsset) => void;
  updateThumbnail: (update: Partial<EditorAsset>) => void;
  removeThumbnail: () => void;
};

export type WorkEditorStoreApi = ReturnType<typeof createWorkEditorStore>;

const updateCurrent = (
  state: WorkEditorStore,
  update: Partial<WorkEditorValues>,
) => ({ current: { ...state.current, ...update } });

export const createWorkEditorStore = () =>
  createStore<WorkEditorStore>((set) => ({
    mode: "new",
    workID: null,
    ownerID: null,
    initializedKey: null,
    current: EMPTY_WORK_EDITOR_VALUES,
    baseline: EMPTY_WORK_EDITOR_VALUES,

    initializeForNew: () => {
      set((state) => {
        if (state.initializedKey === "new") return state;
        revokeValuesPreviewURLs(state.current);
        return {
          mode: "new",
          workID: null,
          ownerID: null,
          initializedKey: "new",
          current: cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
          baseline: cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
        };
      });
    },

    initializeForEdit: (work: Work) => {
      set((state) => {
        if (state.initializedKey === work.id) return state;
        revokeValuesPreviewURLs(state.current);
        const values = toWorkEditorValues(work);
        return {
          mode: "edit",
          workID: work.id,
          ownerID: work.user.id,
          initializedKey: work.id,
          current: values,
          baseline: cloneWorkEditorValues(values),
        };
      });
    },

    // 保存が成功した時点の内容を baseline に取り込み、未保存差分を無くす
    markSaved: () => {
      set((state) => ({ baseline: cloneWorkEditorValues(state.current) }));
    },

    resetEditor: () => {
      set((state) => {
        revokeValuesPreviewURLs(state.current);
        return {
          mode: "new",
          workID: null,
          ownerID: null,
          initializedKey: null,
          current: cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
          baseline: cloneWorkEditorValues(EMPTY_WORK_EDITOR_VALUES),
        };
      });
    },

    setTitle: (title: string) => {
      set((state) => updateCurrent(state, { title }));
    },

    setDescription: (description: string) => {
      set((state) => updateCurrent(state, { description }));
    },

    setVisibility: (visibility: WorkVisibility) => {
      set((state) => updateCurrent(state, { visibility }));
    },

    addTag: (tag: EditorTag) => {
      set((state) => {
        if (state.current.tags.some((current) => current.id === tag.id)) {
          return state;
        }
        return updateCurrent(state, { tags: [...state.current.tags, tag] });
      });
    },

    removeTag: (tagID: string) => {
      set((state) =>
        updateCurrent(state, {
          tags: state.current.tags.filter((tag) => tag.id !== tagID),
        }),
      );
    },

    setUrls: (urls: string[]) => {
      set((state) =>
        updateCurrent(state, { urls: urls.slice(0, MAX_WORK_URL_COUNT) }),
      );
    },

    addAssets: (assets: EditorAsset[]) => {
      set((state) =>
        updateCurrent(state, { assets: [...state.current.assets, ...assets] }),
      );
    },

    updateAsset: (key: string, update: Partial<EditorAsset>) => {
      set((state) =>
        updateCurrent(state, {
          assets: state.current.assets.map((asset) =>
            asset.key === key ? { ...asset, ...update } : asset,
          ),
        }),
      );
    },

    removeAsset: (key: string) => {
      set((state) => {
        const target = state.current.assets.find((asset) => asset.key === key);
        if (!target) return state;
        revokePreviewURL(target.previewURL);
        return updateCurrent(state, {
          assets: state.current.assets.filter((asset) => asset.key !== key),
        });
      });
    },

    setThumbnail: (thumbnail: EditorAsset) => {
      set((state) => {
        revokePreviewURL(state.current.thumbnail?.previewURL ?? null);
        return updateCurrent(state, { thumbnail });
      });
    },

    updateThumbnail: (update: Partial<EditorAsset>) => {
      set((state) => {
        if (!state.current.thumbnail) return state;
        return updateCurrent(state, {
          thumbnail: { ...state.current.thumbnail, ...update },
        });
      });
    },

    removeThumbnail: () => {
      set((state) => {
        revokePreviewURL(state.current.thumbnail?.previewURL ?? null);
        return updateCurrent(state, { thumbnail: null });
      });
    },
  }));

export const selectIsUploading = (state: WorkEditorStore): boolean =>
  state.current.assets.some((asset) => asset.status === "uploading") ||
  state.current.thumbnail?.status === "uploading";
