import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserProfile = {
  display_name: string;
  icon_url: string;
};

type UserStoreProps = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStoreProps>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user: UserProfile | null) => {
        set({ user });
      },
      clearUser: () => {
        set({ user: null });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
