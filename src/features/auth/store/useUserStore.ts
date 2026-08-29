import { create } from "zustand";

export type UserProfile = {
  id: string;
  display_name: string;
  icon_url: string;
};

type UserStore = {
  user: UserProfile | null;
  hasLoadFailed: boolean;
  setUser: (user: UserProfile) => void;
  setUserLoadFailed: () => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  hasLoadFailed: false,
  setUser: (user: UserProfile) => {
    set({ user, hasLoadFailed: false });
  },
  setUserLoadFailed: () => {
    set({ user: null, hasLoadFailed: true });
  },
  clearUser: () => {
    set({ user: null, hasLoadFailed: false });
  },
}));
