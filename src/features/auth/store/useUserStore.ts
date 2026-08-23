import { create } from "zustand";

export type UserProfile = {
  id: string;
  display_name: string;
  icon_url: string;
};

type UserStore = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  setUser: (user: UserProfile | null) => {
    set({ user });
  },
  clearUser: () => {
    set({ user: null });
  },
}));
