import { create } from "zustand";

import type { UserProfile } from "../types";

type UserStore = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: UserProfile | null) => {
    set({ user });
  },
  clearUser: () => {
    set({ user: null });
  },
}));
