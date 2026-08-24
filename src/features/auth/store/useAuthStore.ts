import { create } from "zustand";

type AuthStore = {
  accessToken: string | null;
  isInitialized: boolean;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  isInitialized: false,
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearAuth: () => {
    set({ accessToken: null });
  },
  setInitialized: () => {
    set({ isInitialized: true });
  },
}));
